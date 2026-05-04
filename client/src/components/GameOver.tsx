import { useEffect, useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { contractClient } from '@/lib/contractClient'
import { TxToast, TxState } from './TxToast'

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

interface GameOverProps {
  score: number
  onRetry: () => void
  onMenu: () => void
}

export function GameOver({ score, onRetry, onMenu }: GameOverProps) {
  const { address } = useWalletStore()
  const { sessionScore } = usePlayerStore()
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txHash, setTxHash] = useState<string | undefined>()
  const [txError, setTxError] = useState<string | undefined>()
  const [showPrompt, setShowPrompt] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setShowPrompt((b) => !b), 600)
    return () => clearInterval(t)
  }, [])

  const handleSaveScore = async () => {
    if (!address) return
    setTxState('signing')
    setTxError(undefined)
    try {
      const hash = await contractClient.updateScoreOnChain(address, sessionScore)
      setTxHash(hash)
      setTxState('confirmed')
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Save failed')
      setTxState('failed')
    }
  }

  return (
    <div
      style={{
        width: '100vw', height: '100vh',
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 24,
      }}
    >
      <div style={{ ...S, fontSize: 24, color: '#FCFCFC', textShadow: '3px 3px #E40058' }}>
        GAME OVER
      </div>

      <div style={{ ...S, fontSize: 10, color: '#FAB005' }}>
        SCORE: {String(score).padStart(6, '0')}
      </div>

      {/* Save score prompt */}
      {address && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ ...S, fontSize: 7, color: showPrompt ? '#FCFCFC' : 'transparent' }}>
            SAVE SCORE ON-CHAIN?
          </div>
          <button
            onClick={handleSaveScore}
            disabled={!!txState}
            style={{
              ...S, fontSize: 8,
              background: txState ? '#3C3C3C' : '#00A800',
              color: '#FCFCFC', border: 'none',
              padding: '10px 24px', cursor: txState ? 'not-allowed' : 'pointer',
            }}
          >
            ★ YES — SAVE ON-CHAIN
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <button
          onClick={onRetry}
          style={{
            ...S, fontSize: 8,
            background: '#E40058', color: '#FCFCFC',
            border: 'none', padding: '10px 24px', cursor: 'pointer',
          }}
        >
          ► RETRY
        </button>
        <button
          onClick={onMenu}
          style={{
            ...S, fontSize: 8,
            background: '#000', color: '#FCFCFC',
            border: '2px solid #FCFCFC', padding: '10px 24px', cursor: 'pointer',
          }}
        >
          MAIN MENU
        </button>
      </div>

      {txState && (
        <TxToast state={txState} txHash={txHash} error={txError} onClose={() => setTxState(null)} />
      )}
    </div>
  )
}
