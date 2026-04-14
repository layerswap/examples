import {type Address, isAddress} from 'viem';
import {type Chain, arbitrum, arbitrumSepolia, sepolia} from 'viem/chains';

export type ConfiguredWalletEnv = {
  walletId: string | null;
  ownerAddress: Address | null;
  destinationAddress: Address | null;
};

const sourceChains = {
  ARBITRUM_MAINNET: arbitrum,
  ARBITRUM_SEPOLIA: arbitrumSepolia,
  ETHEREUM_SEPOLIA: sepolia,
} as const;

type SupportedSourceNetwork = keyof typeof sourceChains;

function optional(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function required(name: string): string {
  const value = optional(name);

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function toPositiveNumber(name: string, fallback: number): number {
  const raw = optional(name);

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return parsed;
}

function toBoolean(name: string, fallback: boolean): boolean {
  const raw = optional(name);

  if (!raw) {
    return fallback;
  }

  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  throw new Error(`${name} must be either "true" or "false".`);
}

function toAddress(name: string): Address | null {
  const value = optional(name);

  if (!value) {
    return null;
  }

  if (!isAddress(value)) {
    throw new Error(`${name} must be a valid EVM address.`);
  }

  return value;
}

function toSourceNetwork(
  name: string,
  fallback: SupportedSourceNetwork,
): SupportedSourceNetwork {
  const value = optional(name);

  if (!value) {
    return fallback;
  }

  if (!(value in sourceChains)) {
    throw new Error(
      `${name} must be one of ${Object.keys(sourceChains).join(', ')}.`,
    );
  }

  return value as SupportedSourceNetwork;
}

function createWalletEnv(): ConfiguredWalletEnv {
  return {
    walletId: optional('PRIVY_WALLET_ID'),
    ownerAddress: toAddress('PRIVY_WALLET_ADDRESS'),
    destinationAddress: toAddress('PRIVY_DESTINATION_ADDRESS'),
  };
}

function validateWalletConfig(wallet: ConfiguredWalletEnv): void {
  const hasId = Boolean(wallet.walletId);
  const hasAddress = Boolean(wallet.ownerAddress);

  if (hasId !== hasAddress) {
    throw new Error(
      'PRIVY_WALLET_ID and PRIVY_WALLET_ADDRESS must either both be set or both be blank.',
    );
  }
}

const wallet = createWalletEnv();
validateWalletConfig(wallet);

export const demoEnv = {
  privyAppId: required('PRIVY_APP_ID'),
  privyAppSecret: required('PRIVY_APP_SECRET'),
  layerswapApiBaseUrl: optional('LAYERSWAP_API_BASE_URL') ?? 'https://api.layerswap.io',
  layerswapApiKey: required('LAYERSWAP_API_KEY'),
  rpcUrl: required('EVM_RPC_URL'),
  privySponsorTransactions: toBoolean('PRIVY_SPONSOR_TRANSACTIONS', true),
  sourceNetwork: toSourceNetwork('LAYERSWAP_SOURCE_NETWORK', 'ETHEREUM_SEPOLIA'),
  sourceToken: optional('LAYERSWAP_SOURCE_TOKEN') ?? 'USDC',
  destinationNetwork: optional('LAYERSWAP_DESTINATION_NETWORK') ?? 'ARC_TESTNET',
  destinationToken: optional('LAYERSWAP_DESTINATION_TOKEN') ?? 'USDC',
  amount: toPositiveNumber('LAYERSWAP_AMOUNT', 1),
  privyPollIntervalMs: toPositiveNumber('DEMO_PRIVY_POLL_INTERVAL_MS', 1_000),
  privyPollTimeoutSeconds: toPositiveNumber(
    'DEMO_PRIVY_POLL_TIMEOUT_SECONDS',
    90,
  ),
  walletLabelPrefix: optional('PRIVY_WALLET_LABEL_PREFIX') ?? 'layerswap-privy',
  wallet,
} as const;

export function getSourceChain(): Chain {
  return sourceChains[demoEnv.sourceNetwork];
}
