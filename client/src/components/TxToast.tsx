import { useEffect, useState } from 'react'

export type TxState = 'signing' | 'submitting' | 'confirmed' | 'failed'

interface TxToastProps {
  state: TxState
  txHash?: string
  error?: string
  onClose: () => void
}

const STATE_CONFIG: Record<TxState, { label: string; color: string; icon: string }> = {
  signing:    { label: 'Signing transaction...', color: 'text-accent',   icon: '✍' },
  submitting: { label: 'Submitting to Stellar...', color: 'text-yellow-400', icon: '⟳' },
  confirmed:  { label: 'Transaction confirmed!', color: 'text-success',  icon: '✓' },
  failed:     { label: 'Transaction failed',     color: 'text-danger',   icon: '✗' },
}

export function TxToast({ state, txHash, error, onClose }: TxToastProps) {
  const [visible, setVisible] = useState(true)
  const cfg = STATE_CONFIG[state]

  useEffect(() => {
    if (state === 'confirmed' || state === 'failed') {
      const t = setTimeout(() => { setVisible(false); onClose() }, 5000)
      return () => clearTimeout(t)
    }
  }, [state, onClose])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 glass rounded-xl p-4 min-w-72 modal-enter border border-border">
      <div className="flex items-start gap-3">
        <span className={`text-xl ${cfg.color} font-pixel`}>{cfg.icon}</span>
        <div className="flex-1">
          <p className={`font-pixel text-xs ${cfg.color}`}>{cfg.label}</p>
          {error && <p className="text-danger text-xs font-mono mt-1">{error}</p>}
          {txHash && state === 'confirmed' && (
            <a
              href={`https://testnet.stellarchain.io/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-xs font-mono underline mt-1 block"
            >
              View on Explorer →
            </a>
          )}
        </div>
        <button onClick={() => { setVisible(false); onClose() }} className="text-gray-500 hover:text-white text-xs">✕</button>
      </div>
      {(state === 'signing' || state === 'submitting') && (
        <div className="mt-2 h-1 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: state === 'signing' ? '40%' : '80%' }}
          />
        </div>
      )}
    </div>
  )
}
