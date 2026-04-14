import {PrivyClient} from '@privy-io/node';
import {
  type Address,
  type Hex,
  type PublicClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
  toHex,
} from 'viem';
import type {ConfiguredWalletEnv} from './env.js';
import {LayerswapClient} from './layerswap.js';
import type {
  LayerswapPreparedSwapResponse,
  LayerswapTransferDepositAction,
} from './types.js';

export type WalletContext = {
  walletId: string;
  ownerAddress: Address;
  destinationAddress: Address;
  created: boolean;
};

export type AllowanceSnapshot = {
  tokenAddress: Address;
  spender: Address;
  requiredAmount: bigint;
  allowance: bigint;
  balance: bigint;
  decimals: number;
  symbol: string;
};

export type BatchedCall = {
  to: Address;
  data?: Hex;
  value: bigint;
};

export type PrivyTransactionStatus =
  | 'broadcasted'
  | 'confirmed'
  | 'execution_reverted'
  | 'failed'
  | 'finalized'
  | 'pending'
  | 'provider_error'
  | 'replaced';

type PrivyTrackedTransaction = {
  id: string;
  status: PrivyTransactionStatus;
  transaction_hash: string | null;
  sponsored?: boolean;
  user_operation_hash?: string;
};

export type BatchSubmission = {
  batchedApproval: boolean;
  approvalAmount: bigint | null;
  callCount: number;
  privyTransactionId: string;
  privyStatus: PrivyTransactionStatus;
  sponsored: boolean | null;
  userOperationHash: Hex | null;
  outerTransactionHash: Hex;
};

export type HashLookupSummary = {
  transactionHash: Hex;
  resolvedSwapId: string | null;
  resolvedSequenceNumber: number | null;
  resolvedReferenceId: string | null;
  resolvedStatus: string | null;
  error: string | null;
};

export type ExampleSummary = {
  walletId: string;
  ownerAddress: Address;
  destinationAddress: Address;
  sourceNetwork: string;
  sourceToken: string;
  destinationNetwork: string;
  destinationToken: string;
  requestedAmount: number;
  swapId: string;
  sequenceNumber: number;
  referenceId: string | null;
  depositTarget: string;
  requiredAmount: string;
  batchedApproval: boolean;
  approvalAmount: string | null;
  privyTransactionId: string;
  userOperationHash: Hex | null;
  outerTransactionHash: Hex;
  lookup: HashLookupSummary;
};

export async function getOrCreateWallet(
  privyClient: PrivyClient,
  configuredWallet: ConfiguredWalletEnv,
  walletLabelPrefix: string,
): Promise<WalletContext> {
  if (configuredWallet.walletId && configuredWallet.ownerAddress) {
    return {
      walletId: configuredWallet.walletId,
      ownerAddress: configuredWallet.ownerAddress,
      destinationAddress:
        configuredWallet.destinationAddress ?? configuredWallet.ownerAddress,
      created: false,
    };
  }

  const wallet = await privyClient.wallets().create({
    chain_type: 'ethereum',
    display_name: walletLabelPrefix,
  });
  const ownerAddress = wallet.address as Address;

  return {
    walletId: wallet.id,
    ownerAddress,
    destinationAddress: configuredWallet.destinationAddress ?? ownerAddress,
    created: true,
  };
}

export async function createLayerswapSwap(
  layerswapClient: LayerswapClient,
  wallet: WalletContext,
  parameters: {
    sourceNetwork: string;
    sourceToken: string;
    destinationNetwork: string;
    destinationToken: string;
    amount: number;
    referenceId: string;
  },
): Promise<{
  preparedSwap: LayerswapPreparedSwapResponse;
  depositAction: LayerswapTransferDepositAction;
}> {
  const preparedSwap = await layerswapClient.createSwap({
    source_network: parameters.sourceNetwork,
    source_token: parameters.sourceToken,
    destination_network: parameters.destinationNetwork,
    destination_token: parameters.destinationToken,
    destination_address: wallet.destinationAddress,
    source_address: wallet.ownerAddress,
    refund_address: wallet.ownerAddress,
    reference_id: parameters.referenceId,
    amount: parameters.amount,
    refuel: false,
    use_deposit_address: false,
    use_depository: true,
  });

  const depositAction = getDepositAction(preparedSwap);

  if (!depositAction) {
    throw new Error(`Swap ${preparedSwap.swap.id} did not include a deposit action.`);
  }

  return {preparedSwap, depositAction};
}

export async function readAllowanceSnapshot(
  publicClient: PublicClient,
  wallet: WalletContext,
  preparedSwap: LayerswapPreparedSwapResponse,
  depositAction: LayerswapTransferDepositAction,
): Promise<AllowanceSnapshot> {
  const tokenAddress = preparedSwap.swap.source_token.contract;

  if (!tokenAddress) {
    throw new Error(
      `Swap ${preparedSwap.swap.id} uses a native source asset. This example expects an ERC-20 source token.`,
    );
  }

  const requiredAmount = getRequestedTokenAmountInBaseUnits(preparedSwap);
  const spender = depositAction.to_address as Address;
  const [allowance, balance] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [wallet.ownerAddress, spender],
    }),
    publicClient.readContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet.ownerAddress],
    }),
  ]);

  return {
    tokenAddress: tokenAddress as Address,
    spender,
    requiredAmount,
    allowance,
    balance,
    decimals: preparedSwap.swap.source_token.decimals,
    symbol: preparedSwap.swap.source_token.symbol,
  };
}

export function buildSubmissionCalls(
  preparedSwap: LayerswapPreparedSwapResponse,
  depositAction: LayerswapTransferDepositAction,
  allowance: AllowanceSnapshot,
): {
  calls: BatchedCall[];
  batchedApproval: boolean;
  approvalAmount: bigint | null;
} {
  if (!depositAction.call_data) {
    throw new Error(`Swap ${preparedSwap.swap.id} does not include call_data for the deposit action.`);
  }

  const calls: BatchedCall[] = [];
  let approvalAmount: bigint | null = null;

  if (allowance.allowance < allowance.requiredAmount) {
    approvalAmount = allowance.requiredAmount;

    calls.push({
      to: allowance.tokenAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [allowance.spender, approvalAmount],
      }),
      value: 0n,
    });
  }

  calls.push({
    to: depositAction.to_address as Address,
    data: depositAction.call_data,
    value: getNativeValueInBaseUnits(depositAction),
  });

  return {
    calls,
    batchedApproval: approvalAmount !== null,
    approvalAmount,
  };
}

export async function submitSponsoredCalls(
  privyClient: PrivyClient,
  wallet: WalletContext,
  parameters: {
    sourceCaip2: `eip155:${number}`;
    sponsor: boolean;
    pollIntervalMs: number;
    pollTimeoutSeconds: number;
    calls: BatchedCall[];
    batchedApproval: boolean;
    approvalAmount: bigint | null;
  },
): Promise<BatchSubmission> {
  const rpcResponse = await privyClient.wallets().rpc(wallet.walletId, {
    method: 'wallet_sendCalls',
    chain_type: 'ethereum',
    caip2: parameters.sourceCaip2,
    sponsor: parameters.sponsor,
    params: {
      calls: parameters.calls.map((call) => ({
        to: call.to,
        ...(call.data ? {data: call.data} : {}),
        value: toHex(call.value),
      })),
    },
  });

  const privyTransaction = await waitForPrivyTransaction(privyClient, {
    transactionId: rpcResponse.data.transaction_id,
    pollIntervalMs: parameters.pollIntervalMs,
    pollTimeoutSeconds: parameters.pollTimeoutSeconds,
  });

  if (!privyTransaction.transaction_hash) {
    throw new Error(
      `Privy transaction ${privyTransaction.id} did not return an outer transaction hash.`,
    );
  }

  return {
    batchedApproval: parameters.batchedApproval,
    approvalAmount: parameters.approvalAmount,
    callCount: parameters.calls.length,
    privyTransactionId: privyTransaction.id,
    privyStatus: privyTransaction.status,
    sponsored:
      typeof privyTransaction.sponsored === 'boolean'
        ? privyTransaction.sponsored
        : null,
    userOperationHash: toOptionalHex(privyTransaction.user_operation_hash),
    outerTransactionHash: privyTransaction.transaction_hash as Hex,
  };
}

export async function lookupSwapByTransactionHash(
  layerswapClient: LayerswapClient,
  transactionHash: Hex,
): Promise<HashLookupSummary> {
  try {
    const preparedSwap = await layerswapClient.getSwapByTransactionHash(
      transactionHash,
    );

    return {
      transactionHash,
      resolvedSwapId: preparedSwap.swap.id,
      resolvedSequenceNumber: preparedSwap.swap.metadata.sequence_number,
      resolvedReferenceId: preparedSwap.swap.metadata.reference_id ?? null,
      resolvedStatus: preparedSwap.swap.status,
      error: null,
    };
  } catch (error) {
    return {
      transactionHash,
      resolvedSwapId: null,
      resolvedSequenceNumber: null,
      resolvedReferenceId: null,
      resolvedStatus: null,
      error: toErrorMessage(error),
    };
  }
}

export function formatTokenAmount(value: bigint, decimals: number): string {
  return formatUnits(value, decimals);
}

export function createFundingSummary(parameters: {
  wallet: WalletContext;
  allowance: AllowanceSnapshot;
  sourceNetwork: string;
  sourceToken: string;
}): {
  walletId: string;
  ownerAddress: Address;
  sourceNetwork: string;
  sourceToken: string;
  currentBalance: string;
  requiredBalance: string;
  message: string;
} {
  return {
    walletId: parameters.wallet.walletId,
    ownerAddress: parameters.wallet.ownerAddress,
    sourceNetwork: parameters.sourceNetwork,
    sourceToken: parameters.sourceToken,
    currentBalance: formatTokenAmount(
      parameters.allowance.balance,
      parameters.allowance.decimals,
    ),
    requiredBalance: formatTokenAmount(
      parameters.allowance.requiredAmount,
      parameters.allowance.decimals,
    ),
    message: 'Fund the wallet and rerun the example.',
  };
}

export function createExampleSummary(parameters: {
  wallet: WalletContext;
  sourceNetwork: string;
  sourceToken: string;
  destinationNetwork: string;
  destinationToken: string;
  requestedAmount: number;
  swapId: string;
  sequenceNumber: number;
  referenceId: string | null;
  depositTarget: string;
  allowance: AllowanceSnapshot;
  submission: BatchSubmission;
  lookup: HashLookupSummary;
}): ExampleSummary {
  return {
    walletId: parameters.wallet.walletId,
    ownerAddress: parameters.wallet.ownerAddress,
    destinationAddress: parameters.wallet.destinationAddress,
    sourceNetwork: parameters.sourceNetwork,
    sourceToken: parameters.sourceToken,
    destinationNetwork: parameters.destinationNetwork,
    destinationToken: parameters.destinationToken,
    requestedAmount: parameters.requestedAmount,
    swapId: parameters.swapId,
    sequenceNumber: parameters.sequenceNumber,
    referenceId: parameters.referenceId,
    depositTarget: parameters.depositTarget,
    requiredAmount: formatTokenAmount(
      parameters.allowance.requiredAmount,
      parameters.allowance.decimals,
    ),
    batchedApproval: parameters.submission.batchedApproval,
    approvalAmount:
      parameters.submission.approvalAmount === null
        ? null
        : formatTokenAmount(
            parameters.submission.approvalAmount,
            parameters.allowance.decimals,
          ),
    privyTransactionId: parameters.submission.privyTransactionId,
    userOperationHash: parameters.submission.userOperationHash,
    outerTransactionHash: parameters.submission.outerTransactionHash,
    lookup: parameters.lookup,
  };
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getDepositAction(
  preparedSwap: LayerswapPreparedSwapResponse,
): LayerswapTransferDepositAction | null {
  return (
    [...preparedSwap.deposit_actions]
      .sort((left, right) => left.order - right.order)
      .find((action) => action.type.toLowerCase().includes('transfer')) ?? null
  );
}

function getRequestedTokenAmountInBaseUnits(
  preparedSwap: LayerswapPreparedSwapResponse,
): bigint {
  return parseUnits(
    String(preparedSwap.swap.requested_amount),
    preparedSwap.swap.source_token.decimals,
  );
}

function getNativeValueInBaseUnits(
  depositAction: LayerswapTransferDepositAction,
): bigint {
  return BigInt(depositAction.amount_in_base_units || '0');
}

async function waitForPrivyTransaction(
  privyClient: PrivyClient,
  parameters: {
    transactionId: string;
    pollIntervalMs: number;
    pollTimeoutSeconds: number;
  },
): Promise<PrivyTrackedTransaction> {
  const deadlineMs =
    Date.now() + Math.round(parameters.pollTimeoutSeconds * 1_000);
  let lastSeen: PrivyTrackedTransaction | null = null;

  while (Date.now() <= deadlineMs) {
    const transaction =
      (await privyClient.transactions().get(
        parameters.transactionId,
      )) as PrivyTrackedTransaction;
    lastSeen = transaction;

    if (isFailureStatus(transaction.status)) {
      throw new Error(
        `Privy transaction ${transaction.id} failed with status ${transaction.status}.`,
      );
    }

    if (transaction.transaction_hash) {
      return transaction;
    }

    await sleep(parameters.pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for Privy transaction ${parameters.transactionId}. Last status: ${lastSeen?.status ?? 'unknown'}.`,
  );
}

function isFailureStatus(status: PrivyTransactionStatus): boolean {
  return (
    status === 'execution_reverted' ||
    status === 'failed' ||
    status === 'provider_error' ||
    status === 'replaced'
  );
}

function toOptionalHex(value: string | undefined): Hex | null {
  if (!value || !value.startsWith('0x')) {
    return null;
  }

  return value as Hex;
}

async function sleep(delayMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
