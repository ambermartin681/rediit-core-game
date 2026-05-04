import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '@/stores/walletStore'
import { useGameStore } from '@/stores/gameStore'
import { WalletButton } from '@/components/WalletButton'
import { drawMario, drawCloud, drawHill, drawGoomba, drawCoin } from '@/engine/MarioSprites'

const W = 800
const H = 400
const U = 4 // 1 game unit = 4px

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const frameRef = useRef(0)
  const navigate = useNavigate()
  const { isConnected, address, xlmBalance } = useWalletStore()
  const { setPhase, resetGame } = useGameStore()
  const [menuIdx, setMenuIdx] = useState(0)
  const [blinkOn, setBlinkOn] = useState(true)

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setBlinkOn((b) => !b), 500)
    return () => clearInterval(t)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setMenuIdx((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowDown') setMenuIdx((i) => Math.min(1, i + 1))
      if (e.key === 'Enter' && menuIdx === 0 && isConnected) handleEnterGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuIdx, isConnected])

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mario runner positions
    const runners = [
      { x: -64, y: H - 80, speed: 1.5 },
      { x: W + 64, y: H - 80, speed: -1.2 },
    ]

    const animate = () => {
      frameRef.current++
      const f = frameRef.current

      // Sky background
      ctx.fillStyle = '#5C94FC'
      ctx.fillRect(0, 0, W, H)

      // Clouds (parallax)
      ctx.save()
      const cloudOff = (f * 0.3) % W
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 220 - cloudOff + W) % W)
        drawCloud(ctx, cx, 40, i % 2 === 0 ? 2 : 1)
      }
      ctx.restore()

      // Hills
      drawHill(ctx, 50, H - 120)
      drawHill(ctx, 300, H - 100)
      drawHill(ctx, 580, H - 120)

      // Ground strip
      ctx.fillStyle = '#C84C0C'
      ctx.fillRect(0, H - 64, W, 64)
      ctx.fillStyle = '#E45C10'
      ctx.fillRect(0, H - 64, W, 4)
      // Ground tiles
      for (let x = 0; x < W; x += 16 * U) {
        ctx.fillStyle = '#C84C0C'
        ctx.fillRect(x, H - 64, 16 * U, 64)
        ctx.fillStyle = '#A83C08'
        ctx.fillRect(x, H - 64, 1, 64)
        ctx.fillRect(x, H - 64, 16 * U, 1)
      }

      // Floating coin blocks
      const blockY = H - 160
      for (let i = 0; i < 5; i++) {
        const bx = 200 + i * 80
        ctx.fillStyle = '#FAB005'
        ctx.fillRect(bx, blockY, 16 * U, 16 * U)
        ctx.fillStyle = '#FCFCFC'
        ctx.fillRect(bx, blockY, 16 * U, 2)
        ctx.fillRect(bx, blockY, 2, 16 * U)
        ctx.fillStyle = '#C88000'
        ctx.fillRect(bx, blockY + 16 * U - 2, 16 * U, 2)
        ctx.fillRect(bx + 16 * U - 2, blockY, 2, 16 * U)
        // ? mark
        ctx.fillStyle = '#FCFCFC'
        ctx.fillRect(bx + 6, blockY + 6, 4, 2)
        ctx.fillRect(bx + 8, blockY + 8, 2, 2)
        ctx.fillRect(bx + 8, blockY + 12, 2, 2)
      }

      // Spinning coins above blocks
      for (let i = 0; i < 5; i++) {
        const bx = 200 + i * 80
        drawCoin(ctx, bx + 4, blockY - 24, (f + i * 3) % 4)
      }

      // Goomba patrol
      const gx = ((f * 0.8) % (W + 64)) - 32
      drawGoomba(ctx, gx, H - 80, f, false)

      // Mario runners
      runners[0].x += runners[0].speed
      if (runners[0].x > W + 64) runners[0].x = -64
      runners[1].x += runners[1].speed
      if (runners[1].x < -64) runners[1].x = W + 64

      drawMario(ctx, runners[0].x, runners[0].y, 'walking', Math.floor(f / 8) % 3, 'right', 'none')
      drawMario(ctx, runners[1].x, runners[1].y, 'walking', Math.floor(f / 8) % 3, 'left', 'none')

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleEnterGame = () => {
    resetGame()
    setPhase('playing')
    navigate('/game')
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: W, height: H }}>
        {/* Background canvas */}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: 'block', imageRendering: 'pixelated' }}
        />

        {/* Overlay UI */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {/* Title box */}
          <div
            style={{
              background: '#000',
              border: '4px solid #FCFCFC',
              padding: '16px 32px',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 20,
                color: '#E40058',
                textShadow: '2px 2px #000',
                letterSpacing: '0.05em',
                WebkitFontSmoothing: 'none',
              }}
            >
              REDIIT CORE
            </div>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 10,
                color: '#FAB005',
                marginTop: 8,
                letterSpacing: '0.05em',
                WebkitFontSmoothing: 'none',
              }}
            >
              ★ STELLAR TESTNET ★
            </div>
          </div>

          {/* Menu options */}
          <div
            style={{
              background: '#000',
              border: '4px solid #FCFCFC',
              padding: '16px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 280,
            }}
          >
            {/* 1 Player */}
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: menuIdx === 0 ? '#FCFCFC' : '#7C7C7C',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                WebkitFontSmoothing: 'none',
              }}
              onClick={() => isConnected && handleEnterGame()}
            >
              <span style={{ opacity: menuIdx === 0 && blinkOn ? 1 : 0 }}>►</span>
              1 PLAYER GAME
            </div>

            {/* 2 Player (disabled) */}
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: '#3C3C3C',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                WebkitFontSmoothing: 'none',
              }}
            >
              <span style={{ opacity: 0 }}>►</span>
              2 PLAYER GAME
              <span style={{ fontSize: 6, color: '#5C5C5C' }}>(SOON)</span>
            </div>

            {/* Wallet connect */}
            <div style={{ borderTop: '2px solid #3C3C3C', paddingTop: 12 }}>
              {!isConnected ? (
                <div
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 8,
                    color: blinkOn ? '#FAB005' : 'transparent',
                    textAlign: 'center',
                    marginBottom: 8,
                    WebkitFontSmoothing: 'none',
                  }}
                >
                  INSERT COIN / CONNECT WALLET
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: '#00A800',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {truncate(address!)} — {xlmBalance.toFixed(2)} XLM
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <WalletButton />
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 6,
              color: '#7C7C7C',
              marginTop: 12,
              WebkitFontSmoothing: 'none',
            }}
          >
            © 2024 REDIIT CORE — STELLAR TESTNET
          </div>
        </div>
      </div>
    </div>
  )
}
