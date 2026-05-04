import { useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { stellarClient } from '@/lib/stellarClient'
import { axumClient } from '@/lib/axumClient'

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
      <div className="flex items-center gap-3">
        <div className="glass rounded-xl px-4 py-2 border border-border">
          <p className="font-mono text-xs text-accent">{truncate(address)}</p>
          <p className="font-mono text-xs text-success">{xlmBalance.toFixed(2)} XLM</p>
        </div>
        <button
          onClick={disconnect}
          className="font-pixel text-xs text-danger border border-danger px-3 py-2 hover:bg-danger hover:text-white transition-colors"
        >
          DISCONNECT
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="font-pixel text-sm bg-primary text-white px-6 py-3 pulse-glow hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'CONNECTING...' : 'CONNECT WALLET'}
      </button>
      {error && <p className="text-danger text-xs font-mono mt-2">{error}</p>}
    </div>
  )
}
