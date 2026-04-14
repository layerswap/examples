# Layerswap + Privy Server Wallets

Minimal example of a Layerswap bridge flow from a Privy server wallet using gas sponsorship. It creates a swap with `use_depository: true`, batches `approve(amount)` when needed, and submits the bridge transaction with Privy `wallet_sendCalls`.

## Requirements

- Node 20+
- A Privy app with server wallets and gas sponsorship enabled
- A Layerswap API key
- A source-chain RPC URL
- Source-token funds on the Privy wallet

## Run

```bash
npm install
cp .env.example .env
```

Fill in `.env`, then run:

```bash
npm run demo
```

If `PRIVY_WALLET_ID` and `PRIVY_WALLET_ADDRESS` are left blank, the script creates a new Privy wallet. Fund that wallet and run `npm run demo` again.
