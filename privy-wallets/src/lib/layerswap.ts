import type {
  ApiEnvelope,
  CreateSwapPayload,
  LayerswapPreparedSwapResponse,
  LayerswapSwapResponse,
} from './types.js';

export class LayerswapClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async createSwap(
    payload: CreateSwapPayload,
  ): Promise<LayerswapPreparedSwapResponse> {
    return this.request<LayerswapPreparedSwapResponse>('/api/v2/swaps', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSwap(swapId: string): Promise<LayerswapSwapResponse> {
    return this.request<LayerswapSwapResponse>(`/api/v2/swaps/${swapId}`);
  }

  async getSwapByTransactionHash(
    transactionHash: string,
  ): Promise<LayerswapPreparedSwapResponse> {
    return this.request<LayerswapPreparedSwapResponse>(
      `/api/v2/swaps/by_transaction_hash/${transactionHash}`,
    );
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-LS-APIKEY': this.apiKey,
        ...(init?.headers ?? {}),
      },
    });

    const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !body?.data) {
      const message =
        body?.error?.message ??
        `Layerswap request failed with ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return body.data;
  }
}
