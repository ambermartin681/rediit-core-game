import { useState } from 'react'

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

interface PauseMenuProps {
  onResume: () => void
  onShop: () => void
  onLeaderboard: () => void
  onMenu: () => void
}

const OPTIONS = ['RESUME GAME', 'ITEM SHOP', 'LEADERBOARD', 'QUIT TO TITLE'] as const

export function PauseMenu({ onResume, onShop, onLeaderboard, onMenu }: PauseMenuProps) {
  const [idx, setIdx] = useState(0)

  const handlers: Record<typeof OPTIONS[number], () => void> = {
    'RESUME GAME': onResume,
    'ITEM SHOP': onShop,
    'LEADERBOARD': onLeaderboard,
    'QUIT TO TITLE': onMenu,
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') setIdx((i) => Math.max(0, i - 1))
    if (e.key === 'ArrowDown') setIdx((i) => Math.min(OPTIONS.length - 1, i + 1))
    if (e.key === 'Enter') handlers[OPTIONS[idx]]()
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 30,
      }}
      onKeyDown={handleKey}
      tabIndex={0}
      autoFocus
    >
      <div
        style={{
          background: '#000',
          border: '4px solid #FCFCFC',
          padding: '32px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <span style={{ ...S, fontSize: 14, color: '#FCFCFC' }}>PAUSED</span>
        <div style={{ width: '100%', height: 2, background: '#FCFCFC' }} />
        {OPTIONS.map((opt, i) => (
          <div
            key={opt}
            onClick={() => handlers[opt]()}
            style={{
              ...S,
              fontSize: 8,
              color: i === idx ? '#FAB005' : '#FCFCFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
            }}
            onMouseEnter={() => setIdx(i)}
          >
            <span style={{ opacity: i === idx ? 1 : 0 }}>►</span>
            {opt}
          </div>
        ))}
        <div style={{ ...S, fontSize: 6, color: '#7C7C7C', marginTop: 8 }}>
          ↑↓ NAVIGATE · ENTER SELECT
        </div>
      </div>
    </div>
  )
}
