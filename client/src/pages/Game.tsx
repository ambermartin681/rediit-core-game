import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useGameStore } from '@/stores/gameStore'
import { GameLoop } from '@/engine/GameLoop'
import { Renderer } from '@/engine/Renderer'
import { InputManager } from '@/engine/InputManager'
import { EntityManager } from '@/engine/EntityManager'
import { Camera } from '@/engine/Camera'
import { AudioManager } from '@/engine/AudioManager'
import { aabbOverlap, withinRange } from '@/engine/CollisionSystem'
import { drawPlayer, drawEnemy, drawOrb, drawParticle } from '@/engine/SpriteSheet'
import { HUD } from '@/components/HUD'
import { PauseMenu } from '@/components/PauseMenu'
import { TokenMintModal } from '@/components/TokenMintModal'
import { ItemShopModal } from '@/components/ItemShopModal'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'

const CANVAS_W = 800
const CANVAS_H = 600
const TILE_SIZE = 32
const PLAYER_SPEED = 120
const INTERACT_RANGE = 48

type Modal = 'none' | 'vault' | 'shop' | 'leaderboard'

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export function Game() {
  const navigate = useNavigate()
  const { isConnected, address } = useWalletStore()
  const { hp, sessionScore, activeBuffs, addScore, takeDamage, setPosition, tickBuffs } = usePlayerStore()
  const { phase, map, orbs, enemies, scanlines, setPhase, collectOrb, setElapsedTime } = useGameStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const loopRef = useRef<GameLoop | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const inputRef = useRef<InputManager | null>(null)
  const entitiesRef = useRef<EntityManager | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const audioRef = useRef<AudioManager | null>(null)
  const flashRef = useRef(0) // damage flash timer
  const interactPromptRef = useRef<string | null>(null)
  const frameRef = useRef(0)
  const elapsedRef = useRef(0)

  const [modal, setModal] = useState<Modal>('none')
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null)
  const [isDead, setIsDead] = useState(false)

  // Guard: redirect if not connected
  useEffect(() => {
    if (!isConnected) navigate('/')
  }, [isConnected, navigate])

  // Find special tile positions
  const findTile = useCallback((type: number): { x: number; y: number } | null => {
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === type) return { x: c * TILE_SIZE, y: r * TILE_SIZE }
      }
    }
    return null
  }, [map])

  const vaultPos = findTile(2)
  const shrinePos = findTile(3)
  const shopPos = findTile(4)

  // Build wall rects for collision
  const wallRects = useRef<Array<{ x: number; y: number; width: number; height: number }>>([])
  useEffect(() => {
    wallRects.current = []
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === 1) {
          wallRects.current.push({ x: c * TILE_SIZE, y: r * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE })
        }
      }
    }
  }, [map])

  // Init engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isConnected) return

    const renderer = new Renderer(canvas)
    const input = new InputManager()
    const audio = new AudioManager()
    const camera = new Camera(CANVAS_W, CANVAS_H, map[0].length * TILE_SIZE, map.length * TILE_SIZE)
    const entities = new EntityManager(
      100, 100,
      enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, dx: e.dx, patrolMin: e.patrolMin, patrolMax: e.patrolMax })),
      orbs.map((o) => ({ id: o.id, x: o.x, y: o.y, collected: o.collected })),
    )

    rendererRef.current = renderer
    inputRef.current = input
    audioRef.current = audio
    cameraRef.current = camera
    entitiesRef.current = entities

    const update = (dt: number) => {
      if (phase === 'paused') return
      const inp = inputRef.current!
      const ent = entitiesRef.current!
      const p = ent.player

      audio.resume()

      // Pause on ESC
      if (inp.wasJustPressed('Escape')) {
        setPhase('paused')
        inp.flush()
        return
      }

      // Player movement
      const hasSpeed = activeBuffs.some((b) => b.type === 'Speed')
      const speed = PLAYER_SPEED * (hasSpeed ? 1.5 : 1)
      let vx = 0
      let vy = 0
      if (inp.isDown('KeyW') || inp.isDown('ArrowUp'))    vy = -speed
      if (inp.isDown('KeyS') || inp.isDown('ArrowDown'))  vy =  speed
      if (inp.isDown('KeyA') || inp.isDown('ArrowLeft'))  vx = -speed
      if (inp.isDown('KeyD') || inp.isDown('ArrowRight')) vx =  speed

      // Normalize diagonal
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }

      p.isMoving = vx !== 0 || vy !== 0
      if (vx < 0) p.direction = 'left'
      if (vx > 0) p.direction = 'right'

      // Animate frames
      p.frameTimer += dt
      if (p.isMoving) {
        if (p.frameTimer > 0.12) { p.frame = (p.frame % 4 + 1) % 4; p.frameTimer = 0 }
      } else {
        if (p.frameTimer > 0.4) { p.frame = 4 + (p.frame % 2 === 0 ? 1 : 0); p.frameTimer = 0 }
      }

      // Move X then Y (separate axis collision)
      let nx = p.x + vx * dt
      let ny = p.y + vy * dt

      // World bounds
      nx = Math.max(0, Math.min(nx, map[0].length * TILE_SIZE - p.width))
      ny = Math.max(0, Math.min(ny, map.length * TILE_SIZE - p.height))

      // Wall collision X
      for (const wall of wallRects.current) {
        if (aabbOverlap({ x: nx, y: p.y, width: p.width, height: p.height }, wall)) {
          nx = p.x
          break
        }
      }
      // Wall collision Y
      for (const wall of wallRects.current) {
        if (aabbOverlap({ x: nx, y: ny, width: p.width, height: p.height }, wall)) {
          ny = p.y
          break
        }
      }

      p.x = nx
      p.y = ny
      setPosition(p.x, p.y)

      // Invincibility timer
      if (p.invincibleTimer > 0) p.invincibleTimer -= dt

      // Orb collection
      for (const orb of ent.orbs) {
        if (orb.collected) continue
        orb.pulseTimer += dt * 3
        if (aabbOverlap(p, { x: orb.x - 8, y: orb.y - 8, width: 16, height: 16 })) {
          orb.collected = true
          collectOrb(orb.id)
          addScore(10)
          audio.playCollect()
          ent.spawnParticles(orb.x, orb.y, '#00cfff', 8)
        }
      }

      // Enemy patrol + collision
      const hasCloak = activeBuffs.some((b) => b.type === 'Cloak')
      for (const enemy of ent.enemies) {
        enemy.x += enemy.dx * enemy.speed * dt
        if (enemy.x <= enemy.patrolMin || enemy.x >= enemy.patrolMax) {
          enemy.dx *= -1
        }

        if (!hasCloak && p.invincibleTimer <= 0 &&
          aabbOverlap(p, { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height })) {
          takeDamage()
          p.invincibleTimer = 1.5
          flashRef.current = 0.3
          audio.playDamage()
          ent.spawnParticles(p.x + 16, p.y + 16, '#ff3b6f', 12)
        }
      }

      // Particles
      ent.updateParticles(dt)

      // Camera follow
      cameraRef.current!.follow(p.x, p.y, p.width, p.height)

      // Interact prompt
      let prompt: string | null = null
      if (vaultPos && withinRange(p, { x: vaultPos.x, y: vaultPos.y, width: TILE_SIZE, height: TILE_SIZE }, INTERACT_RANGE)) {
        prompt = 'Press E to mint token'
      } else if (shrinePos && withinRange(p, { x: shrinePos.x, y: shrinePos.y, width: TILE_SIZE, height: TILE_SIZE }, INTERACT_RANGE)) {
        prompt = 'Press E to view leaderboard'
      } else if (shopPos && withinRange(p, { x: shopPos.x, y: shopPos.y, width: TILE_SIZE, height: TILE_SIZE }, INTERACT_RANGE)) {
        prompt = 'Press E to open shop'
      }
      interactPromptRef.current = prompt
      setInteractPrompt(prompt)

      // E key interaction
      if (inp.wasJustPressed('KeyE') && prompt) {
        audio.playInteract()
        if (prompt.includes('mint')) setModal('vault')
        else if (prompt.includes('leaderboard')) setModal('leaderboard')
        else if (prompt.includes('shop')) setModal('shop')
      }

      // Elapsed time
      elapsedRef.current += dt
      setElapsedTime(elapsedRef.current)

      // Buff tick
      tickBuffs()

      // Death check
      if (hp <= 0) {
        setPhase('dead')
        setIsDead(true)
      }

      // Damage flash decay
      if (flashRef.current > 0) flashRef.current -= dt * 2

      inp.flush()
      frameRef.current++
    }

    const draw = () => {
      const r = rendererRef.current!
      const ent = entitiesRef.current!
      const cam = cameraRef.current!

      r.clear()
      cam.begin(r.ctx)

      // Draw tiles
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
          if (cam.isVisible(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)) {
            r.drawTile(col, row, map[row][col], TILE_SIZE)
          }
        }
      }

      // Draw orbs
      for (const orb of ent.orbs) {
        if (!orb.collected && cam.isVisible(orb.x - 8, orb.y - 8, 16, 16)) {
          drawOrb(r.ctx, orb.x - 8, orb.y - 8, orb.pulseTimer)
        }
      }

      // Draw enemies
      for (const enemy of ent.enemies) {
        if (cam.isVisible(enemy.x, enemy.y, enemy.width, enemy.height)) {
          drawEnemy(r.ctx, enemy.x, enemy.y, frameRef.current)
        }
      }

      // Draw player (flicker when invincible)
      const p = ent.player
      const shouldDraw = p.invincibleTimer <= 0 || Math.floor(p.invincibleTimer * 10) % 2 === 0
      if (shouldDraw) {
        drawPlayer(r.ctx, p.x, p.y, p.frame, p.direction)
        // Name tag
        if (address) {
          r.drawText(truncate(address), p.x - 8, p.y - 6, '#00cfff', 6)
        }
      }

      // Draw particles
      for (const particle of ent.particles) {
        const alpha = particle.life / particle.maxLife
        drawParticle(r.ctx, particle.x, particle.y, particle.size, particle.color, alpha)
      }

      // Interact prompt (world space)
      if (interactPromptRef.current) {
        r.drawText(interactPromptRef.current, p.x - 40, p.y - 18, '#ffcc00', 6)
      }

      cam.end(r.ctx)

      // Damage flash (screen space)
      if (flashRef.current > 0) {
        r.flashScreen('#ff3b6f', flashRef.current * 0.4)
      }
    }

    const loop = new GameLoop(update, draw)
    loopRef.current = loop
    if (phase === 'playing') loop.start()

    return () => {
      loop.stop()
      input.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  // Pause/resume loop when phase changes
  useEffect(() => {
    const loop = loopRef.current
    if (!loop) return
    if (phase === 'playing') loop.start()
    else loop.stop()
  }, [phase])

  const handleResume = () => {
    setModal('none')
    setPhase('playing')
  }

  const handlePause = () => setPhase('paused')

  // CSS scale canvas to viewport
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)

  return (
    <div className="w-full h-screen bg-bg flex items-center justify-center overflow-hidden">
      {/* Game canvas wrapper */}
      <div
        ref={wrapperRef}
        id="game-canvas-wrapper"
        className={`relative ${scanlines ? 'scanlines' : ''}`}
        style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <canvas
          ref={canvasRef}
          id="game-canvas"
          width={CANVAS_W}
          height={CANVAS_H}
          className="pixel-render"
        />

        {/* HUD overlay (React DOM, not canvas) */}
        <HUD onPause={handlePause} />

        {/* Interact prompt (React DOM fallback) */}
        {interactPrompt && phase === 'playing' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
            <p className="font-pixel text-xs text-yellow-400 bg-surface/80 px-3 py-1 border border-yellow-400/50">
              {interactPrompt}
            </p>
          </div>
        )}

        {/* Pause menu */}
        {phase === 'paused' && modal === 'none' && (
          <PauseMenu
            onResume={handleResume}
            onShop={() => setModal('shop')}
            onLeaderboard={() => setModal('leaderboard')}
          />
        )}

        {/* Modals */}
        {modal === 'vault' && <TokenMintModal onClose={() => { setModal('none'); setPhase('playing') }} />}
        {modal === 'shop' && <ItemShopModal onClose={() => { setModal('none'); setPhase('playing') }} />}
        {modal === 'leaderboard' && <LeaderboardPanel onClose={() => { setModal('none'); setPhase('playing') }} />}

        {/* Death screen */}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
            <div className="glass rounded-xl p-8 flex flex-col items-center gap-4 border border-danger modal-enter">
              <h2 className="font-pixel text-danger text-lg">GAME OVER</h2>
              <p className="font-pixel text-xs text-gray-400">Final Score: <span className="text-success">{sessionScore}</span></p>
              <button
                onClick={() => {
                  setIsDead(false)
                  useGameStore.getState().resetGame()
                  usePlayerStore.getState().resetSession()
                  setPhase('playing')
                  loopRef.current?.start()
                }}
                className="font-pixel text-xs bg-primary text-white px-6 py-3 hover:bg-purple-700 transition-colors"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={() => navigate('/')}
                className="font-pixel text-xs border border-border text-gray-400 px-6 py-3 hover:border-white hover:text-white transition-colors"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
