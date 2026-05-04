import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useGameStore } from '@/stores/gameStore'
import { WalletButton } from '@/components/WalletButton'

interface Star {
  x: number
  y: number
  z: number
  px: number
  py: number
}

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const navigate = useNavigate()
  const { isConnected, address, xlmBalance } = useWalletStore()
  const { onChainScore } = usePlayerStore()
  const { setPhase, resetGame } = useGameStore()

  // Init stars
  useEffect(() => {
    const W = window.innerWidth
    const H = window.innerHeight
    starsRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random() * W - W / 2,
      y: Math.random() * H - H / 2,
      z: Math.random() * W,
      px: 0,
      py: 0,
    }))
  }, [])

  // Starfield animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      const W = canvas.width
      const H = canvas.height
      const mx = mouseRef.current.x - W / 2
      const my = mouseRef.current.y - H / 2

      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, W, H)

      for (const star of starsRef.current) {
        star.z -= 2 + Math.abs(mx) * 0.002 + Math.abs(my) * 0.002

        if (star.z <= 0) {
          star.x = Math.random() * W - W / 2
          star.y = Math.random() * H - H / 2
          star.z = W
          star.px = star.x
          star.py = star.y
        }

        const sx = (star.x / star.z) * W + W / 2
        const sy = (star.y / star.z) * H + H / 2
        const size = Math.max(0.5, (1 - star.z / W) * 3)
        const brightness = Math.floor((1 - star.z / W) * 255)

        ctx.beginPath()
        ctx.moveTo(star.px, star.py)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = `rgba(${brightness},${brightness},${Math.min(255, brightness + 80)},${(1 - star.z / W) * 0.8})`
        ctx.lineWidth = size
        ctx.stroke()

        star.px = sx
        star.py = sy
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  const handleEnterGame = () => {
    resetGame()
    setPhase('playing')
    navigate('/game')
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg flex items-center justify-center">
      {/* Starfield canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Stellar Wave badge */}
      <div className="absolute top-4 left-4 glass rounded-xl px-3 py-2 border border-border">
        <p className="font-pixel text-xs text-primary">⭐ STELLAR WAVE</p>
        <p className="font-pixel text-xs text-gray-500">ECOSYSTEM</p>
      </div>

      {/* Version tag */}
      <div className="absolute bottom-4 right-4">
        <p className="font-mono text-xs text-gray-600">v0.1.0 — Testnet</p>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-pixel text-4xl md:text-5xl text-primary glitch crt-glow leading-tight">
            REDIIT
          </h1>
          <h1 className="font-pixel text-4xl md:text-5xl text-accent leading-tight">
            CORE
          </h1>
          <div className="mt-2 h-1 bg-gradient-to-r from-primary via-accent to-success" />
        </div>

        {/* Tagline */}
        <p className="font-pixel text-xs text-gray-400 text-center">
          Play. Own. Earn on Stellar.
        </p>

        {/* Wallet section */}
        <div className="flex flex-col items-center gap-4">
          <WalletButton />

          {isConnected && address && (
            <div className="glass rounded-xl px-6 py-3 border border-border text-center">
              {onChainScore > 0 ? (
                <p className="font-pixel text-xs text-success">
                  Welcome back, {truncate(address)} | Score: {onChainScore.toLocaleString()}
                </p>
              ) : (
                <p className="font-pixel text-xs text-accent">
                  New player detected. Enter to begin.
                </p>
              )}
              <p className="font-mono text-xs text-gray-400 mt-1">{xlmBalance.toFixed(4)} XLM</p>
            </div>
          )}

          <button
            onClick={handleEnterGame}
            disabled={!isConnected}
            className="font-pixel text-sm bg-success text-black px-8 py-4 pulse-glow hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
          >
            ENTER GAME →
          </button>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {['60 FPS Canvas', 'Freighter Wallet', 'Soroban Contracts', 'On-Chain Scores'].map((f) => (
            <span key={f} className="font-pixel text-xs border border-border text-gray-500 px-2 py-1">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
