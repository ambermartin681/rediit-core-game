import { create } from 'zustand'

export type GamePhase = 'landing' | 'playing' | 'paused' | 'dead'

interface GameState {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'landing',
  setPhase: (phase) => set({ phase }),
  resetGame: () => set({ phase: 'playing' }),
}))
