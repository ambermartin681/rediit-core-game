const BASE = import.meta.env.VITE_AXUM_SERVER as string

export interface PlayerProfile {
  address: string
  high_score: number
  last_active: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

export const axumClient = {
  healthCheck: () => request<{ status: string }>('/health'),
  getPlayer: (address: string) => request<PlayerProfile>(`/player/${address}`),
  submitScore: (address: string, score: number) =>
    request<{ success: boolean }>('/submit_score', {
      method: 'POST',
      body: JSON.stringify({ address, score }),
    }),
  buyItem: (address: string, itemId: string) =>
    request<{ success: boolean; item_id: string }>(`/buy/${address}/${itemId}`, {
      method: 'POST',
    }),
}
