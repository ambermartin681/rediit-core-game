import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { axumClient } from '@/lib/axumClient'
import { contractClient } from '@/lib/contractClient'
import { TxToast, TxState } from './TxToast'

interface LeaderboardPanelProps {
  onClose: () => void
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Mock leaderboard data (real multi-player in Phase 3)
const MOCK_LEADERS = [
  { address: 'GBXYZ1234567890ABCDEF', score: 98420, lastActive: '2026-05-03' },
  { address: 'GCABC9876543210FEDCBA', score: 87300, lastActive: '2026-05-04' },
  { address: 'GDDEF1111222233334444', score: 76100, lastActive: '2026-05-02' },
  { address: 'GEEFG5555666677778888', score: 65000, lastActive: '2026-05-01' },
  { address: 'GFGHI9999000011112222', score: 54200, lastActive: '2026-04-30' },
  { address: 'GGHIJ3333444455556666', score: 43100, lastActive: '2026-04-29' },
  { address: 'GHIJK7777888899990000', score: 32000, lastActive: '2026-04-28' },
  { address: 'GIJKL1234432112344321', score: 21500, lastActive: '2026-04-27' },
  { address: 'GJKLM9876678998766789', score: 10800, lastActive: '2026-04-26' },
  { address: 'GKLMN5432123454321234', score: 5400,  lastActive: '2026-04-25' },
]

export function LeaderboardPanel({ onClose }: LeaderboardPanelProps) {
  const { address } = useWalletStore()
  const { onChainScore, sessionScore } = usePlayerStore()
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txHash, setTxHash] = useState<string | undefined>()
  const [txError, setTxError] = useState<string | undefined>()

  const { data: profile } = useQuery({
    queryKey: ['player', address],
    queryFn: () => axumClient.getPlayer(address!),
    enabled: !!address,
  })

  const handleSyncOnChain = async () => {
    if (!address) return
    setTxState('signing')
    setTxError(undefined)
    try {
      const hash = await contractClient.updateScoreOnChain(address, sessionScore)
      setTxHash(hash)
      setTxState('confirmed')
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Sync failed')
      setTxState('failed')
    }
  }

  // Merge connected player into leaderboard
  const leaders = address
    ? [
        ...MOCK_LEADERS.slice(0, 9),
        { address, score: profile?.high_score ?? onChainScore, lastActive: 'Today' },
      ].sort((a, b) => b.score - a.score).slice(0, 10)
    : MOCK_LEADERS

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40">
      <div className="glass rounded-xl p-8 w-[560px] flex flex-col gap-4 modal-enter border border-primary max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-pixel text-primary text-xs">🏆 LEADERBOARD</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="font-pixel text-gray-400 text-left py-2 w-8">#</th>
              <th className="font-pixel text-gray-400 text-left py-2">ADDRESS</th>
              <th className="font-pixel text-gray-400 text-right py-2">SCORE</th>
              <th className="font-pixel text-gray-400 text-right py-2">LAST ACTIVE</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((row, i) => {
              const isMe = address && row.address === address
              return (
                <tr
                  key={row.address}
                  className={`border-b border-border/50 ${isMe ? 'bg-primary/10' : ''}`}
                >
                  <td className={`font-pixel py-2 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-yellow-700' : 'text-gray-500'}`}>
                    {i + 1}
                  </td>
                  <td className={`font-mono py-2 ${isMe ? 'text-accent' : 'text-gray-300'}`}>
                    {truncate(row.address)} {isMe && '← YOU'}
                  </td>
                  <td className="font-mono text-success text-right py-2">{row.score.toLocaleString()}</td>
                  <td className="font-mono text-gray-500 text-right py-2">{row.lastActive}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* YOUR STATS */}
        <div className="border-t border-border pt-4 flex flex-col gap-2">
          <p className="font-pixel text-xs text-gray-400">YOUR STATS</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface border border-border p-3">
              <p className="font-pixel text-xs text-gray-500">ON-CHAIN HIGH SCORE</p>
              <p className="font-mono text-success text-lg">{(profile?.high_score ?? onChainScore).toLocaleString()}</p>
            </div>
            <div className="bg-surface border border-border p-3">
              <p className="font-pixel text-xs text-gray-500">SESSION BEST</p>
              <p className="font-mono text-accent text-lg">{sessionScore.toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={handleSyncOnChain}
            disabled={!address || !!txState}
            className="font-pixel text-xs bg-primary text-white py-3 hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            SYNC SCORE ON-CHAIN
          </button>
        </div>
      </div>

      {txState && (
        <TxToast
          state={txState}
          txHash={txHash}
          error={txError}
          onClose={() => setTxState(null)}
        />
      )}
    </div>
  )
}
