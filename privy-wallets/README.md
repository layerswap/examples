# Using Layerswap With Privy Wallets

Bridge tokens through Layerswap from a Privy server wallet using Privy's native gas sponsorship.

The two important parts of this flow are:

- Create the swap with `use_depository: true`, which is recommended when using Layerswap from a contract wallet or a server wallet.
- If the wallet does not already have enough allowance, batch `approve(exactAmount)` with the bridge call in the same sponsored `wallet_sendCalls` request.

For ERC-20 routes like USDC:

- The approval amount comes from the source token amount you asked Layerswap to bridge.
- `depositAction.amount_in_base_units` is the native transaction `value` for the prepared bridge call.

## Prerequisites

You will need:

- a Privy app with server wallets enabled
- gas sponsorship enabled in the Privy dashboard for the source chain
- a Layerswap API key
- source-token funds on the Privy wallet address
- a read client for the source chain

The read client is only for checking ERC-20 allowance before sending. Layerswap prepares the bridge call, but it does not provide wallet state from the source chain.

Start by creating the Privy client and a source-chain read client:

```ts
import {PrivyClient} from '@privy-io/node';
import {createPublicClient, http} from 'viem';
import {sepolia} from 'viem/chains';

const privyClient = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.EVM_RPC_URL!),
});

const LAYERSWAP_API_KEY = process.env.LAYERSWAP_API_KEY!;
```

## 1. Create or get a Privy wallet

If you already have a Privy wallet, reuse its `walletId` and `address`.

Otherwise, create one:

```ts
const wallet = await privyClient.wallets().create({
  chain_type: 'ethereum',
});

const walletId = wallet.id;
const walletAddress = wallet.address;
```

## 2. Create a Layerswap swap

Create the swap for the Privy wallet address:

```bash
curl --request POST 'https://api.layerswap.io/api/v2/swaps' \
  --header 'Content-Type: application/json' \
  --header 'X-LS-APIKEY: <LAYERSWAP_API_KEY>' \
  --data '{
    "source_network": "ETHEREUM_SEPOLIA",
    "source_token": "USDC",
    "destination_network": "ARC_TESTNET",
    "destination_token": "USDC",
    "destination_address": "<WALLET_ADDRESS>",
    "amount": 1,
    "use_depository": true
  }'
```

In your app, store the response `data` object as `preparedSwap`, then extract the prepared bridge call:

```ts
const depositAction = [...preparedSwap.deposit_actions]
  .sort((a, b) => a.order - b.order)
  .find((action) => action.type.toLowerCase().includes('transfer'));

if (!depositAction?.call_data) {
  throw new Error('Layerswap did not return a deposit action.');
}
```

## 3. Read allowance and build the batch

This Layerswap route uses a pull-based ERC-20 transfer, so the wallet needs allowance if the token has not already been approved. The approval amount comes from `preparedSwap.swap.requested_amount`. The deposit action's `amount_in_base_units` is the native `value` to send with the bridge call.

```ts
import {encodeFunctionData, erc20Abi, parseUnits, toHex} from 'viem';

const tokenAddress = preparedSwap.swap.source_token.contract as `0x${string}`;
const spender = depositAction.to_address as `0x${string}`;
const requestedAmount = String(preparedSwap.swap.requested_amount);
const requiredAmount = parseUnits(
  requestedAmount,
  preparedSwap.swap.source_token.decimals,
);

const allowance = await publicClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'allowance',
  args: [walletAddress as `0x${string}`, spender],
});

const bridgeCall = {
  to: depositAction.to_address,
  data: depositAction.call_data,
  value: toHex(BigInt(depositAction.amount_in_base_units || '0')),
};

const calls =
  allowance < requiredAmount
    ? [
        {
          to: tokenAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender, requiredAmount],
          }),
          value: '0x0',
        },
        bridgeCall,
      ]
    : [bridgeCall];
```

## 4. Submit the sponsored transaction

Submit the batched calls with Privy `wallet_sendCalls` and `sponsor: true`.

```ts
const sendCallsResponse = await privyClient.wallets().rpc(walletId, {
  method: 'wallet_sendCalls',
  chain_type: 'ethereum',
  caip2: 'eip155:11155111',
  sponsor: true,
  params: {
    calls,
  },
});
```

Privy returns a `transaction_id`, so poll the Privy transaction API until the final chain transaction hash is available:

```ts
let outerTransactionHash: string | null = null;

while (!outerTransactionHash) {
  const transaction = await privyClient.transactions().get(
    sendCallsResponse.data.transaction_id,
  );

  if (
    transaction.status === 'failed' ||
    transaction.status === 'execution_reverted' ||
    transaction.status === 'provider_error' ||
    transaction.status === 'replaced'
  ) {
    throw new Error(`Privy transaction failed with status ${transaction.status}`);
  }

  outerTransactionHash = transaction.transaction_hash;

  if (!outerTransactionHash) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
```

## 5. Check the swap by transaction hash

After Privy returns the final chain transaction hash, look it up through Layerswap:

```bash
curl \
  --header 'X-LS-APIKEY: <LAYERSWAP_API_KEY>' \
  "https://api.layerswap.io/api/v2/swaps/by_transaction_hash/<OUTER_TRANSACTION_HASH>"
```

That lets you map the final transaction back to the Layerswap swap record.
