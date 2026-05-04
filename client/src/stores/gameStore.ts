import { create } from 'zustand'

export type GamePhase = 'landing' | 'playing' | 'paused' | 'dead'

export interface Orb {
  id: number
  x: number
  y: number
  collected: boolean
}

export interface Enemy {
  id: number
  x: number
  y: number
  dx: number
  patrolMin: number
  patrolMax: number
}

// 25×18 tile map: 0=floor, 1=wall, 2=special(vault), 3=special(shrine), 4=special(shop)
const BASE_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

function makeOrbs(): Orb[] {
  const positions = [
    {x:3,y:3},{x:6,y:5},{x:10,y:2},{x:14,y:4},{x:18,y:3},
    {x:22,y:2},{x:5,y:9},{x:9,y:7},{x:13,y:10},{x:17,y:8},
    {x:21,y:9},{x:3,y:13},{x:7,y:15},{x:11,y:14},{x:15,y:13},
    {x:19,y:15},{x:23,y:13},{x:8,y:11},{x:16,y:11},{x:12,y:6},
  ]
  return positions.map((p, i) => ({
    id: i,
    x: p.x * 32 + 8,
    y: p.y * 32 + 8,
    collected: false,
  }))
}

function makeEnemies(): Enemy[] {
  return [
    { id: 0, x: 160, y: 64,  dx: 1, patrolMin: 96,  patrolMax: 320 },
    { id: 1, x: 480, y: 128, dx: -1, patrolMin: 320, patrolMax: 640 },
    { id: 2, x: 256, y: 288, dx: 1, patrolMin: 160, patrolMax: 480 },
    { id: 3, x: 608, y: 352, dx: -1, patrolMin: 480, patrolMax: 736 },
  ]
}

interface GameState {
  phase: GamePhase
  map: number[][]
  orbs: Orb[]
  enemies: Enemy[]
  collectedOrbs: number
  elapsedTime: number
  scanlines: boolean
  volume: number
  setPhase: (phase: GamePhase) => void
  collectOrb: (id: number) => void
  resetGame: () => void
  setElapsedTime: (t: number) => void
  toggleScanlines: () => void
  setVolume: (v: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'landing',
  map: BASE_MAP,
  orbs: makeOrbs(),
  enemies: makeEnemies(),
  collectedOrbs: 0,
  elapsedTime: 0,
  scanlines: true,
  volume: 0.5,
  setPhase: (phase) => set({ phase }),
  collectOrb: (id) =>
    set((s) => ({
      orbs: s.orbs.map((o) => (o.id === id ? { ...o, collected: true } : o)),
      collectedOrbs: s.collectedOrbs + 1,
    })),
  resetGame: () =>
    set({ orbs: makeOrbs(), enemies: makeEnemies(), collectedOrbs: 0, elapsedTime: 0, phase: 'playing' }),
  setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  toggleScanlines: () => set((s) => ({ scanlines: !s.scanlines })),
  setVolume: (volume) => set({ volume }),
}))
