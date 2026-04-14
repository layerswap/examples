export type ApiErrorShape = {
  message?: string;
  code?: string;
};

export type ApiEnvelope<T> = {
  data?: T;
  error?: ApiErrorShape;
};

export type LayerswapToken = {
  symbol: string;
  contract: string | null;
  decimals: number;
  precision: number;
  logo?: string;
};

export type LayerswapNetwork = {
  name: string;
  display_name: string;
  chain_id: string;
  node_url?: string;
  transaction_explorer_template?: string;
  account_explorer_template?: string;
  type: string;
  token: LayerswapToken;
};

export type LayerswapSwapTransaction = {
  id?: string;
  status?: string;
  type?: string;
  transaction_id?: string;
  created_date?: string;
};

export type LayerswapSwap = {
  id: string;
  created_date: string;
  source_network: LayerswapNetwork;
  source_token: LayerswapToken;
  destination_network: LayerswapNetwork;
  destination_token: LayerswapToken;
  requested_amount: number;
  destination_address: string;
  status: string;
  fail_reason?: string | null;
  use_deposit_address: boolean;
  metadata: {
    sequence_number: number;
    reference_id?: string | null;
    exchange_account?: string | null;
  };
  transactions: LayerswapSwapTransaction[];
};

export type LayerswapQuote = {
  receive_amount: number;
  min_receive_amount: number;
  blockchain_fee: number;
  service_fee: number;
  total_fee: number;
  total_fee_in_usd: number;
  avg_completion_time: string;
};

export type LayerswapTransferDepositAction = {
  type: string;
  to_address: string;
  amount: number;
  order: number;
  amount_in_base_units: string;
  network: LayerswapNetwork;
  token: LayerswapToken;
  fee_token: LayerswapToken;
  call_data?: `0x${string}` | null;
  gas_limit?: string | null;
  encoded_args?: string[] | null;
};

export type LayerswapSwapResponse = {
  swap: LayerswapSwap;
  quote: LayerswapQuote;
};

export type LayerswapPreparedSwapResponse = LayerswapSwapResponse & {
  deposit_actions: LayerswapTransferDepositAction[];
};

export type CreateSwapPayload = {
  source_network: string;
  source_token: string;
  destination_network: string;
  destination_token: string;
  destination_address: string;
  source_address: string;
  refund_address: string;
  reference_id: string;
  amount: number;
  refuel: boolean;
  use_deposit_address: boolean;
  use_depository: boolean;
};
