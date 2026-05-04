import { create } from 'zustand'

export type BuffType = 'Speed' | 'Shield' | 'Multiplier' | 'Cloak'

export interface Buff {
  type: BuffType
  expiresAt: number // timestamp ms
}

interface PlayerState {
  onChainScore: number
  sessionScore: number
  hp: number
  activeBuffs: Buff[]
  position: { x: number; y: number }
  setOnChainScore: (score: number) => void
  addScore: (n: number) => void
  resetSession: () => void
  takeDamage: () => void
  healFull: () => void
  applyBuff: (buff: Buff) => void
  tickBuffs: () => void
  setPosition: (x: number, y: number) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  onChainScore: 0,
  sessionScore: 0,
  hp: 5,
  activeBuffs: [],
  position: { x: 100, y: 100 },
  setOnChainScore: (onChainScore) => set({ onChainScore }),
  addScore: (n) =>
    set((s) => ({ sessionScore: s.sessionScore + n })),
  resetSession: () => set({ sessionScore: 0, hp: 5, activeBuffs: [], position: { x: 100, y: 100 } }),
  takeDamage: () =>
    set((s) => ({ hp: Math.max(0, s.hp - 1) })),
  healFull: () => set({ hp: 5 }),
  applyBuff: (buff) =>
    set((s) => ({
      activeBuffs: [...s.activeBuffs.filter((b) => b.type !== buff.type), buff],
    })),
  tickBuffs: () =>
    set((s) => ({
      activeBuffs: s.activeBuffs.filter((b) => b.expiresAt > Date.now()),
    })),
  setPosition: (x, y) => set({ position: { x, y } }),
}))
