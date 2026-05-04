import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useGameStore } from '@/stores/gameStore'
import { HUD } from '@/components/HUD'
import { PauseMenu } from '@/components/PauseMenu'
import { TokenMintModal } from '@/components/TokenMintModal'
import { ItemShopModal } from '@/components/ItemShopModal'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { GameOver } from '@/components/GameOver'
import { PipeTransition } from '@/components/PipeTransition'
import { AudioManager } from '@/engine/AudioManager'
import { ScrollCamera } from '@/engine/ScrollCamera'
import {
  createBody, stepPhysics,
  type PhysicsBody, type TileRect,
} from '@/engine/Physics'
import {
  LEVEL_MAP, TILE, TILE_SIZE, MAP_COLS, MAP_ROWS,
  CANVAS_W, CANVAS_H, STELLAR_BLOCKS,
  GOOMBA_SPAWNS, KOOPA_SPAWNS,
} from '@/engine/LevelMap'
import {
  drawMario, drawGoomba, drawKoopa, drawCoin,
  drawQuestionBlock, drawBrick, drawGround, drawPipe,
  drawCloud, drawHill, drawFlag, drawMushroom, drawStarman,
} from '@/engine/MarioSprites'

const U = 4 // 1 game unit = 4 canvas px
const TS = TILE_SIZE * U // tile size in canvas px = 64

type Modal = 'none' | 'shop' | 'mint' | 'leaderboard'

interface Enemy {
  id: number
  x: number
  y: number
  vx: number
  alive: boolean
  squished: boolean
  squishTimer: number
  type: 'goomba' | 'koopa'
  inShell: boolean
  frame: number
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; size: number
}

interface FloatingCoin {
  x: number; y: number; vy: number; life: number
}

interface BlockAnim {
  col: number; row: number; offsetY: number; dir: 1 | -1 | 0
}

export function Game() {
  const navigate = useNavigate()
  const { isConnected, address } = useWalletStore()
  const { hp, sessionScore, addScore, takeDamage, tickBuffs, activeBuffs } = usePlayerStore()
  const { phase, setPhase } = useGameStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef(new AudioManager())
  const cameraRef = useRef(new ScrollCamera(CANVAS_W, CANVAS_H, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE))
  const bodyRef = useRef<PhysicsBody>(createBody(3 * TILE_SIZE, 22 * TILE_SIZE))
  const keysRef = useRef<Set<string>>(new Set())
  const mapRef = useRef(LEVEL_MAP.map((r) => [...r]))
  const enemiesRef = useRef<Enemy[]>([
    ...GOOMBA_SPAWNS.map((s, i) => ({
      id: i, x: s.x, y: s.y, vx: -1, alive: true,
      squished: false, squishTimer: 0, type: 'goomba' as const, inShell: false, frame: 0,
    })),
    ...KOOPA_SPAWNS.map((s, i) => ({
      id: 100 + i, x: s.x, y: s.y, vx: -1, alive: true,
      squished: false, squishTimer: 0, type: 'koopa' as const, inShell: false, frame: 0,
    })),
  ])
  const particlesRef = useRef<Particle[]>([])
  const floatingCoinsRef = useRef<FloatingCoin[]>([])
  const blockAnimsRef = useRef<BlockAnim[]>([])
  const rafRef = useRef(0)
  const frameRef = useRef(0)
  const timerRef = useRef(400)
  const timerTickRef = useRef(0)
  const coinsRef = useRef(0)
  const livesRef = useRef(3)
  const deadTimerRef = useRef(0)
  const pipeEnterRef = useRef(false)
  const pipeEnterTimerRef = useRef(0)
  const pendingModalRef = useRef<Modal>('none')

  const [modal, setModal] = useState<Modal>('none')
  const [showPipe, setShowPipe] = useState(false)
  const [isDead, setIsDead] = useState(false)
  const [gameOverFinal, setGameOverFinal] = useState(false)
  const [hudCoins, setHudCoins] = useState(0)
  const [hudTimer, setHudTimer] = useState(400)
  const [hudLives, setHudLives] = useState(3)

  useEffect(() => {
    if (!isConnected) navigate('/')
  }, [isConnected, navigate])

  // Key handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.code)
      e.preventDefault()
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const spawnParticles = useCallback((x: number, y: number, color: string, n: number) => {
    for (let i = 0; i < n; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4 - 1,
        life: 30, maxLife: 30,
        color, size: 4,
      })
    }
  }, [])

  const getTiles = useCallback((cx: number): TileRect[] => {
    const col = Math.floor(cx / TILE_SIZE)
    const colMin = Math.max(0, col - 2)
    const colMax = Math.min(MAP_COLS - 1, col + 14)
    const rects: TileRect[] = []
    const map = mapRef.current
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = colMin; c <= colMax; c++) {
        const t = map[r][c]
        if (t === TILE.SKY || t === TILE.COIN || t === TILE.MUSHROOM) continue
        rects.push({ x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE, type: t })
      }
    }
    return rects
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isConnected) return
    const ctx = canvas.getContext('2d')!

    const loop = () => {
      if (phase === 'paused') { rafRef.current = requestAnimationFrame(loop); return }

      audioRef.current.resume()
      frameRef.current++
      const f = frameRef.current
      const body = bodyRef.current
      const cam = cameraRef.current
      const map = mapRef.current
      const keys = keysRef.current

      // ESC → pause
      if (keys.has('Escape')) {
        keys.delete('Escape')
        setPhase('paused')
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Pipe entry animation
      if (pipeEnterRef.current) {
        pipeEnterTimerRef.current++
        if (pipeEnterTimerRef.current > 40) {
          pipeEnterRef.current = false
          pipeEnterTimerRef.current = 0
          setShowPipe(false)
          setModal(pendingModalRef.current)
        }
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Death animation
      if (body.dead) {
        deadTimerRef.current++
        stepPhysics(body, [], keys, 1 / 60)
        if (deadTimerRef.current > 120) {
          livesRef.current--
          setHudLives(livesRef.current)
          if (livesRef.current <= 0) {
            setGameOverFinal(true)
          } else {
            // Respawn
            const nb = createBody(3 * TILE_SIZE, 22 * TILE_SIZE)
            bodyRef.current = nb
            deadTimerRef.current = 0
            timerRef.current = 400
          }
        }
        cam.follow(body.x * U, body.y * U, body.width * U, body.height * U)
        drawFrame(ctx, f, cam, map, body)
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Timer countdown
      timerTickRef.current++
      if (timerTickRef.current >= 60) {
        timerTickRef.current = 0
        timerRef.current = Math.max(0, timerRef.current - 1)
        setHudTimer(timerRef.current)
        if (timerRef.current === 0) {
          body.dead = true
          audioRef.current.playerDead()
        }
      }

      // Physics step
      const tiles = getTiles(body.x)
      const { hitBlockFromBelow } = stepPhysics(body, tiles, keys, 1 / 60)

      // Block hit from below
      if (hitBlockFromBelow) {
        const { col, row } = tileCoord(hitBlockFromBelow)
        const t = map[row][col]
        if (t === TILE.QBLOCK) {
          audioRef.current.blockBump()
          map[row][col] = TILE.QUSED
          blockAnimsRef.current.push({ col, row, offsetY: 0, dir: -1 })
          // Stellar triggers
          if (col === STELLAR_BLOCKS.MINT_COL) {
            floatingCoinsRef.current.push({ x: col * TILE_SIZE * U, y: row * TILE_SIZE * U, vy: -3, life: 40 })
            setModal('mint')
          } else if (col === STELLAR_BLOCKS.LEADERBOARD_COL) {
            floatingCoinsRef.current.push({ x: col * TILE_SIZE * U, y: row * TILE_SIZE * U, vy: -3, life: 40 })
            setModal('leaderboard')
          } else {
            // Regular coin
            coinsRef.current++
            setHudCoins(coinsRef.current)
            addScore(200)
            floatingCoinsRef.current.push({ x: col * TILE_SIZE * U, y: row * TILE_SIZE * U, vy: -3, life: 40 })
            audioRef.current.coinCollect()
          }
        } else if (t === TILE.BRICK) {
          audioRef.current.blockBump()
          blockAnimsRef.current.push({ col, row, offsetY: 0, dir: -1 })
        }
      }

      // Collect map coins
      const pCol = Math.floor(body.x / TILE_SIZE)
      const pRow = Math.floor(body.y / TILE_SIZE)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = pRow + dr; const c = pCol + dc
          if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS && map[r][c] === TILE.COIN) {
            map[r][c] = TILE.SKY
            coinsRef.current++
            setHudCoins(coinsRef.current)
            addScore(100)
            audioRef.current.coinCollect()
            floatingCoinsRef.current.push({ x: c * TILE_SIZE * U, y: r * TILE_SIZE * U, vy: -3, life: 40 })
          }
        }
      }

      // Pipe interaction (Down key near shop pipe)
      if (keys.has('ArrowDown')) {
        const nearPipeCol = Math.abs(pCol - STELLAR_BLOCKS.SHOP_PIPE_COL) <= 1
        if (nearPipeCol && body.onGround) {
          keys.delete('ArrowDown')
          audioRef.current.pipeEnter()
          pipeEnterRef.current = true
          pipeEnterTimerRef.current = 0
          pendingModalRef.current = 'shop'
          setShowPipe(true)
        }
      }

      // Enemy update
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue
        if (enemy.squished) {
          enemy.squishTimer++
          if (enemy.squishTimer > 30) enemy.alive = false
          continue
        }
        enemy.x += enemy.vx
        enemy.frame = Math.floor(f / 12) % 2
        // Wall bounce
        const eCol = Math.floor(enemy.x / TILE_SIZE)
        const eRow = Math.floor(enemy.y / TILE_SIZE)
        if (eCol >= 0 && eCol < MAP_COLS && eRow >= 0 && eRow < MAP_ROWS) {
          const ahead = map[eRow][eCol + (enemy.vx > 0 ? 1 : -1)]
          if (ahead && ahead !== TILE.SKY && ahead !== TILE.COIN) enemy.vx *= -1
        }
        // Gravity
        enemy.y += 2
        const groundRow = MAP_ROWS - 2
        if (enemy.y > groundRow * TILE_SIZE) enemy.y = groundRow * TILE_SIZE

        // Player stomp
        const px = body.x * U; const py = body.y * U
        const ex = enemy.x * U; const ey = enemy.y * U
        const ew = 16 * U; const eh = 16 * U
        const bw = body.width * U; const bh = body.height * U
        const overlap = px < ex + ew && px + bw > ex && py < ey + eh && py + bh > ey
        if (overlap) {
          const stompedFromAbove = body.vy > 0 && py + bh - 8 < ey + eh / 2
          if (stompedFromAbove) {
            enemy.squished = true
            enemy.squishTimer = 0
            body.vy = -5
            addScore(100)
            audioRef.current.enemySquish()
            spawnParticles(ex + ew / 2, ey, '#A80000', 6)
          } else if (body.invincible === 0) {
            takeDamage()
            body.invincible = 90
            audioRef.current.playerDead()
            if (hp - 1 <= 0) {
              body.dead = true
              deadTimerRef.current = 0
            }
          }
        }
      }

      // Buff tick
      tickBuffs()

      // Fall off screen → die
      if (body.y * U > CANVAS_H + 64) {
        body.dead = true
        deadTimerRef.current = 0
        audioRef.current.playerDead()
      }

      // Camera
      cam.follow(body.x * U, body.y * U, body.width * U, body.height * U)

      // Update block anims
      for (const ba of blockAnimsRef.current) {
        ba.offsetY += ba.dir * 2
        if (ba.offsetY <= -8) ba.dir = 1
        if (ba.offsetY >= 0) { ba.offsetY = 0; ba.dir = 0 }
      }
      blockAnimsRef.current = blockAnimsRef.current.filter((ba) => ba.dir !== 0 || ba.offsetY === 0)

      // Update floating coins
      for (const fc of floatingCoinsRef.current) {
        fc.y += fc.vy
        fc.vy += 0.3
        fc.life--
      }
      floatingCoinsRef.current = floatingCoinsRef.current.filter((fc) => fc.life > 0)

      // Update particles
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--
      }
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

      drawFrame(ctx, f, cam, map, body)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, phase])

  function tileCoord(rect: TileRect) {
    return { col: Math.round(rect.x / TILE_SIZE), row: Math.round(rect.y / TILE_SIZE) }
  }

  function drawFrame(
    ctx: CanvasRenderingContext2D,
    f: number,
    cam: ScrollCamera,
    map: number[][],
    body: PhysicsBody,
  ) {
    // Sky
    ctx.fillStyle = '#5C94FC'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Parallax background (clouds, hills) — screen space
    const bgOff = cam.bgOffset(0.3)
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 240 - bgOff % 240 + 240) % (CANVAS_W + 240)) - 48
      drawCloud(ctx, cx, 20, i % 2 === 0 ? 2 : 1)
    }
    const hillOff = cam.bgOffset(0.5)
    for (let i = 0; i < 4; i++) {
      const hx = ((i * 300 - hillOff % 300 + 300) % (CANVAS_W + 300)) - 48
      drawHill(ctx, hx, CANVAS_H - 80)
    }

    // World tiles
    cam.begin(ctx)
    const colMin = Math.floor(cam.x / TILE_SIZE) - 1
    const colMax = colMin + Math.ceil(CANVAS_W / TILE_SIZE) + 2
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = Math.max(0, colMin); c <= Math.min(MAP_COLS - 1, colMax); c++) {
        const t = map[r][c]
        const tx = c * TS; const ty = r * TS
        if (t === TILE.GROUND || t === TILE.STAIR) {
          drawGround(ctx, tx, ty)
        } else if (t === TILE.BRICK) {
          // Check block anim
          const ba = blockAnimsRef.current.find((b) => b.col === c && b.row === r)
          drawBrick(ctx, tx, ty + (ba ? ba.offsetY : 0))
        } else if (t === TILE.QBLOCK) {
          const ba = blockAnimsRef.current.find((b) => b.col === c && b.row === r)
          drawQuestionBlock(ctx, tx, ty, false, ba ? ba.offsetY : 0)
        } else if (t === TILE.QUSED) {
          drawQuestionBlock(ctx, tx, ty, true)
        } else if (t === TILE.COIN) {
          drawCoin(ctx, tx + TS / 4, ty + TS / 4, Math.floor(f / 8) % 4)
        } else if (t === TILE.PIPE_TOP) {
          // Draw pipe from top tile downward
          let h = 1
          let rr = r + 1
          while (rr < MAP_ROWS && map[rr][c] === TILE.PIPE_BOT) { h++; rr++ }
          drawPipe(ctx, tx - TS / 4, ty, h)
        }
      }
    }

    // Flag pole at col 193
    drawFlag(ctx, 193 * TS, (MAP_ROWS - 10) * TS, 8)

    // Enemies
    for (const enemy of enemiesRef.current) {
      if (!enemy.alive) continue
      const ex = enemy.x * U; const ey = enemy.y * U
      if (!cam.isVisible(ex, ey, 16 * U, 16 * U)) continue
      if (enemy.type === 'goomba') {
        drawGoomba(ctx, ex, ey, enemy.frame, enemy.squished)
      } else {
        drawKoopa(ctx, ex, ey, enemy.frame, enemy.inShell)
      }
    }

    // Floating coins
    for (const fc of floatingCoinsRef.current) {
      drawCoin(ctx, fc.x, fc.y, Math.floor(f / 4) % 4)
    }

    // Particles
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
    ctx.globalAlpha = 1

    // Player
    const px = body.x * U; const py = body.y * U
    const shouldDraw = body.invincible === 0 || Math.floor(body.invincible / 5) % 2 === 0
    if (shouldDraw) {
      drawMario(ctx, px, py, body.state, body.frame, body.dir, body.powerUp)
    }

    // Pipe entry overlay
    if (pipeEnterRef.current) {
      const t = pipeEnterTimerRef.current / 40
      ctx.globalAlpha = t * 0.8
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.globalAlpha = 1
    }

    cam.end(ctx)

    // Invincible flash overlay
    if (body.invincible > 60 && Math.floor(body.invincible / 5) % 2 === 0) {
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#FCFCFC'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.globalAlpha = 1
    }
  }

  // Touch controls
  const touchKey = (code: string, down: boolean) => {
    if (down) keysRef.current.add(code)
    else keysRef.current.delete(code)
  }

  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)

  if (gameOverFinal) {
    return (
      <GameOver
        score={sessionScore}
        onRetry={() => {
          bodyRef.current = createBody(3 * TILE_SIZE, 22 * TILE_SIZE)
          mapRef.current = LEVEL_MAP.map((r) => [...r])
          livesRef.current = 3
          timerRef.current = 400
          coinsRef.current = 0
          setHudCoins(0)
          setHudTimer(400)
          setHudLives(3)
          setGameOverFinal(false)
          setPhase('playing')
        }}
        onMenu={() => navigate('/')}
      />
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div
        id="game-canvas-wrapper"
        style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', imageRendering: 'pixelated' }}
        />

        <HUD
          coins={hudCoins}
          timer={hudTimer}
          lives={hudLives}
          onPause={() => setPhase('paused')}
        />

        {showPipe && <PipeTransition />}

        {phase === 'paused' && modal === 'none' && (
          <PauseMenu
            onResume={() => setPhase('playing')}
            onShop={() => setModal('shop')}
            onLeaderboard={() => setModal('leaderboard')}
            onMenu={() => navigate('/')}
          />
        )}

        {modal === 'mint' && <TokenMintModal onClose={() => { setModal('none'); setPhase('playing') }} />}
        {modal === 'shop' && <ItemShopModal onClose={() => { setModal('none'); setPhase('playing') }} />}
        {modal === 'leaderboard' && <LeaderboardPanel onClose={() => { setModal('none'); setPhase('playing') }} />}

        {/* Touch D-pad */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, zIndex: 20 }}>
          <button className="dpad-btn" onPointerDown={() => touchKey('ArrowUp', true)} onPointerUp={() => touchKey('ArrowUp', false)}>▲</button>
          <div style={{ display: 'flex', gap: 2 }}>
            <button className="dpad-btn" onPointerDown={() => touchKey('ArrowLeft', true)} onPointerUp={() => touchKey('ArrowLeft', false)}>◄</button>
            <button className="dpad-btn" onPointerDown={() => touchKey('ArrowDown', true)} onPointerUp={() => touchKey('ArrowDown', false)}>▼</button>
            <button className="dpad-btn" onPointerDown={() => touchKey('ArrowRight', true)} onPointerUp={() => touchKey('ArrowRight', false)}>►</button>
          </div>
        </div>
        {/* Touch A/B */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 8, zIndex: 20 }}>
          <button className="dpad-btn" style={{ borderRadius: '50%', background: 'rgba(228,0,88,0.7)' }} onPointerDown={() => touchKey('ShiftLeft', true)} onPointerUp={() => touchKey('ShiftLeft', false)}>B</button>
          <button className="dpad-btn" style={{ borderRadius: '50%', background: 'rgba(0,88,248,0.7)' }} onPointerDown={() => touchKey('Space', true)} onPointerUp={() => touchKey('Space', false)}>A</button>
        </div>
      </div>
    </div>
  )
}
