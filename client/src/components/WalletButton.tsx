import { useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { stellarClient } from '@/lib/stellarClient'
import { axumClient } from '@/lib/axumClient'

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export function WalletButton() {
  const { address, xlmBalance, isConnected, connect, disconnect, setXlmBalance } = useWalletStore()
  const { setOnChainScore } = usePlayerStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const addr = await stellarClient.getPublicKey()
      connect(addr)
      const bal = await stellarClient.getXLMBalance(addr)
      setXlmBalance(bal)
      try {
        const profile = await axumClient.getPlayer(addr)
        setOnChainScore(profile.high_score)
      } catch {
        // new player
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#000', border: '2px solid #FAB005', padding: '6px 12px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FAB005' }}>
            {truncate(address)}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00A800' }}>
            {xlmBalance.toFixed(2)} XLM
          </div>
        </div>
        <button
          onClick={disconnect}
          className="nes-btn nes-btn-red"
          style={{ fontSize: 7 }}
        >
          DISCONNECT
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="nes-btn nes-btn-gold"
        style={{ fontSize: 8 }}
      >
        {loading ? 'CONNECTING...' : 'CONNECT WALLET'}
      </button>
      {error && (
        <div style={{ ...S, fontSize: 6, color: '#E40058' }}>{error}</div>
      )}
    </div>
  )
}
