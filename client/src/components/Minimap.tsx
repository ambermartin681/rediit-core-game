import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'

const MINI_W = 80
const MINI_H = 60
const TILE_SIZE = 32

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { map, orbs, enemies } = useGameStore()
  const { position } = usePlayerStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cols = map[0].length
    const rows = map.length
    const tw = MINI_W / cols
    const th = MINI_H / rows

    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, MINI_W, MINI_H)

    // Draw tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = map[r][c]
        if (t === 1) ctx.fillStyle = '#2a2a3f'
        else if (t === 2) ctx.fillStyle = '#003344'
        else if (t === 3) ctx.fillStyle = '#1a0040'
        else if (t === 4) ctx.fillStyle = '#001a0d'
        else ctx.fillStyle = '#111118'
        ctx.fillRect(c * tw, r * th, tw, th)
      }
    }

    // Orbs
    ctx.fillStyle = '#ffcc00'
    for (const orb of orbs) {
      if (orb.collected) continue
      const ox = (orb.x / (cols * TILE_SIZE)) * MINI_W
      const oy = (orb.y / (rows * TILE_SIZE)) * MINI_H
      ctx.fillRect(ox - 1, oy - 1, 2, 2)
    }

    // Enemies
    ctx.fillStyle = '#ff3b6f'
    for (const enemy of enemies) {
      const ex = (enemy.x / (cols * TILE_SIZE)) * MINI_W
      const ey = (enemy.y / (rows * TILE_SIZE)) * MINI_H
      ctx.fillRect(ex - 1, ey - 1, 3, 3)
    }

    // Player
    ctx.fillStyle = '#00cfff'
    const px = (position.x / (cols * TILE_SIZE)) * MINI_W
    const py = (position.y / (rows * TILE_SIZE)) * MINI_H
    ctx.fillRect(px - 2, py - 2, 4, 4)

    // Border
    ctx.strokeStyle = '#2a2a3f'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, MINI_W, MINI_H)
  })

  return (
    <canvas
      ref={canvasRef}
      width={MINI_W}
      height={MINI_H}
      className="pixel-render pixel-border"
      style={{ width: MINI_W, height: MINI_H }}
    />
  )
}
