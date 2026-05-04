import { useEffect, useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

interface HUDProps {
  coins: number
  timer: number
  lives: number
  onPause: () => void
}

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

export function HUD({ coins, timer, lives, onPause }: HUDProps) {
  const { address, xlmBalance } = useWalletStore()
  const { sessionScore, hp, activeBuffs } = usePlayerStore()
  const [scorePop, setScorePop] = useState(false)
  const [prevScore, setPrevScore] = useState(sessionScore)
  const [walletBlink, setWalletBlink] = useState(true)

  useEffect(() => {
    if (sessionScore !== prevScore) {
      setScorePop(true)
      setPrevScore(sessionScore)
      setTimeout(() => setScorePop(false), 300)
    }
  }, [sessionScore, prevScore])

  useEffect(() => {
    if (!address) {
      const t = setInterval(() => setWalletBlink((b) => !b), 500)
      return () => clearInterval(t)
    }
  }, [address])

  const timerRed = timer < 100

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 32,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* REDIIT + score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>REDIIT</span>
        <span
          style={{
            ...S,
            fontSize: 8,
            color: scorePop ? '#FAB005' : '#FCFCFC',
            transform: scorePop ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.1s, color 0.1s',
          }}
        >
          {String(sessionScore).padStart(6, '0')}
        </span>
      </div>

      {/* COINS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>COINS</span>
        <span style={{ ...S, fontSize: 8, color: '#FAB005' }}>
          ×{String(coins).padStart(2, '0')}
        </span>
      </div>

      {/* WORLD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>WORLD</span>
        <span style={{ ...S, fontSize: 8, color: '#FCFCFC' }}>1-1</span>
      </div>

      {/* TIME */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>TIME</span>
        <span
          style={{
            ...S,
            fontSize: 8,
            color: timerRed ? '#E40058' : '#FCFCFC',
            animation: timerRed ? 'nes-blink 0.5s step-end infinite' : 'none',
          }}
        >
          {String(timer).padStart(3, '0')}
        </span>
      </div>

      {/* WALLET */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', minWidth: 100 }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>WALLET</span>
        {address ? (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#00A800' }}>
            {truncate(address)}
          </span>
        ) : (
          <span style={{ ...S, fontSize: 6, color: walletBlink ? '#FAB005' : 'transparent' }}>
            NO WALLET
          </span>
        )}
        {address && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: '#00FF94' }}>
            {xlmBalance.toFixed(2)} XLM
          </span>
        )}
      </div>

      {/* LIVES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>LIVES</span>
        <span style={{ ...S, fontSize: 8, color: '#FCFCFC' }}>×{lives}</span>
      </div>

      {/* POWER-UP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', minWidth: 48 }}>
        <span style={{ ...S, fontSize: 6, color: '#FCFCFC' }}>POWER</span>
        <span style={{ ...S, fontSize: 6, color: '#FAB005' }}>
          {activeBuffs.length > 0 ? activeBuffs[0].type.toUpperCase().slice(0, 5) : '-----'}
        </span>
      </div>

      {/* Pause button */}
      <button
        onClick={onPause}
        style={{
          ...S,
          fontSize: 6,
          color: '#FCFCFC',
          background: 'none',
          border: '1px solid #FCFCFC',
          padding: '2px 6px',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      >
        ESC
      </button>
    </div>
  )
}
