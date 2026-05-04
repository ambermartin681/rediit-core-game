import { useEffect, useRef, useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useGameStore } from '@/stores/gameStore'
import { axumClient } from '@/lib/axumClient'
import { contractClient } from '@/lib/contractClient'
import { TxToast, TxState } from './TxToast'
import { Minimap } from './Minimap'

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

interface HUDProps {
  onPause: () => void
}

export function HUD({ onPause }: HUDProps) {
  const { address, xlmBalance, tokenBalance } = useWalletStore()
  const { hp, sessionScore, activeBuffs } = usePlayerStore()
  const { phase } = useGameStore()
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txHash, setTxHash] = useState<string | undefined>()
  const [txError, setTxError] = useState<string | undefined>()
  const [cooldown, setCooldown] = useState(false)
  const [prevScore, setPrevScore] = useState(sessionScore)
  const [scorePop, setScorePop] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (sessionScore !== prevScore) {
      setScorePop(true)
      setPrevScore(sessionScore)
      setTimeout(() => setScorePop(false), 300)
    }
  }, [sessionScore, prevScore])

  const handleSaveScore = async () => {
    if (!address || cooldown) return
    setCooldown(true)
    setTxState('signing')
    setTxError(undefined)
    try {
      await axumClient.submitScore(address, sessionScore)
      setTxState('submitting')
      const hash = await contractClient.updateScoreOnChain(address, sessionScore)
      setTxHash(hash)
      setTxState('confirmed')
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Unknown error')
      setTxState('failed')
    }
    cooldownRef.current = setTimeout(() => setCooldown(false), 30000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearTimeout(cooldownRef.current) }, [])

  if (phase !== 'playing' && phase !== 'paused') return null

  const BUFF_ICONS: Record<string, string> = {
    Speed: '⚡', Shield: '🛡', Multiplier: '×2', Cloak: '👁',
  }

  return (
    <>
      {/* TOP-LEFT */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary flex items-center justify-center text-xs">👾</div>
          {address && <span className="font-mono text-xs text-accent">{truncate(address)}</span>}
        </div>
        {/* HP bar */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`hp-segment${i >= hp ? ' empty' : ''}`} />
          ))}
        </div>
        {/* Score */}
        <div className={`font-pixel text-xs text-success ${scorePop ? 'score-pop' : ''}`}>
          {String(sessionScore).padStart(6, '0')}
        </div>
        {/* Active buffs */}
        {activeBuffs.length > 0 && (
          <div className="flex gap-1">
            {activeBuffs.map((b) => (
              <span key={b.type} className="font-pixel text-xs bg-surface border border-border px-1">
                {BUFF_ICONS[b.type] ?? b.type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* TOP-RIGHT */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1 pointer-events-none">
        <span className="font-pixel text-xs bg-yellow-600 text-black px-2 py-0.5">TESTNET</span>
        <span className="font-mono text-xs text-success">{xlmBalance.toFixed(4)} XLM</span>
        <span className="font-mono text-xs text-accent">{tokenBalance.toFixed(0)} RDIIT</span>
      </div>

      {/* BOTTOM-LEFT: minimap */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <Minimap />
      </div>

      {/* BOTTOM-CENTER: action bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="font-pixel text-xs text-gray-500">WASD Move · E Interact · ESC Menu</p>
      </div>

      {/* BOTTOM-RIGHT: save score */}
      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
        <button
          onClick={handleSaveScore}
          disabled={cooldown || !address}
          className="font-pixel text-xs bg-success text-black px-3 py-2 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed pointer-events-auto"
        >
          {cooldown ? 'SAVED (30s)' : 'SAVE SCORE'}
        </button>
        <button
          onClick={onPause}
          className="font-pixel text-xs border border-border text-gray-400 px-3 py-2 hover:border-primary hover:text-white transition-colors pointer-events-auto"
        >
          ESC / PAUSE
        </button>
      </div>

      {txState && (
        <TxToast
          state={txState}
          txHash={txHash}
          error={txError}
          onClose={() => setTxState(null)}
        />
      )}
    </>
  )
}
