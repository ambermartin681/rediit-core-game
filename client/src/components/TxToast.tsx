import { useEffect, useState } from 'react'

export type TxState = 'signing' | 'submitting' | 'confirmed' | 'failed'

interface TxToastProps {
  state: TxState
  txHash?: string
  error?: string
  onClose: () => void
}

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

const CONFIG: Record<TxState, { label: string; color: string; icon: string; bg: string }> = {
  signing:    { label: 'SIGNING...',       color: '#FAB005', icon: '▣', bg: '#000040' },
  submitting: { label: 'SUBMITTING...',    color: '#FCFCFC', icon: '►', bg: '#000040' },
  confirmed:  { label: 'CONFIRMED! 1 UP!', color: '#00A800', icon: '★', bg: '#003000' },
  failed:     { label: 'TX FAILED',        color: '#E40058', icon: '✗', bg: '#300000' },
}

export function TxToast({ state, txHash, error, onClose }: TxToastProps) {
  const [visible, setVisible] = useState(true)
  const cfg = CONFIG[state]

  useEffect(() => {
    if (state === 'confirmed' || state === 'failed') {
      const t = setTimeout(() => { setVisible(false); onClose() }, 5000)
      return () => clearTimeout(t)
    }
  }, [state, onClose])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        background: cfg.bg,
        border: `3px solid ${cfg.color}`,
        padding: '12px 16px',
        minWidth: 260,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Coin/icon animation */}
        <span
          style={{
            ...S, fontSize: 14, color: cfg.color,
            display: 'inline-block',
            animation: state === 'confirmed' ? 'coin-fly 0.6s ease-out' : 'none',
          }}
        >
          {cfg.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ ...S, fontSize: 7, color: cfg.color }}>{cfg.label}</div>
          {error && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#E40058', marginTop: 4 }}>
              {error}
            </div>
          )}
          {txHash && state === 'confirmed' && (
            <a
              href={`https://testnet.stellarchain.io/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FAB005', display: 'block', marginTop: 4 }}
            >
              VIEW ON EXPLORER →
            </a>
          )}
        </div>
        <button
          onClick={() => { setVisible(false); onClose() }}
          style={{ ...S, fontSize: 8, color: '#7C7C7C', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      {(state === 'signing' || state === 'submitting') && (
        <div style={{ height: 4, background: '#1C1C1C' }}>
          <div
            style={{
              height: '100%',
              background: cfg.color,
              width: state === 'signing' ? '40%' : '80%',
              transition: 'width 0.5s',
            }}
          />
        </div>
      )}
    </div>
  )
}
