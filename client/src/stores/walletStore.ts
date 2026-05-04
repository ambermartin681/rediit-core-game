import { create } from 'zustand'

interface WalletState {
  address: string | null
  xlmBalance: number
  tokenBalance: number
  isConnected: boolean
  connect: (address: string) => void
  disconnect: () => void
  setXlmBalance: (balance: number) => void
  setTokenBalance: (balance: number) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  xlmBalance: 0,
  tokenBalance: 0,
  isConnected: false,
  connect: (address) => set({ address, isConnected: true }),
  disconnect: () => set({ address: null, xlmBalance: 0, tokenBalance: 0, isConnected: false }),
  setXlmBalance: (xlmBalance) => set({ xlmBalance }),
  setTokenBalance: (tokenBalance) => set({ tokenBalance }),
}))
