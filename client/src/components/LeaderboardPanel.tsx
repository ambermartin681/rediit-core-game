import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { axumClient } from '@/lib/axumClient'
import { contractClient } from '@/lib/contractClient'
import { TxToast, TxState } from './TxToast'

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const MOCK_LEADERS = [
  { address: 'GBXYZ1234567890ABCDEF', score: 98420 },
  { address: 'GCABC9876543210FEDCBA', score: 87300 },
  { address: 'GDDEF1111222233334444', score: 76100 },
  { address: 'GEEFG5555666677778888', score: 65000 },
  { address: 'GFGHI9999000011112222', score: 54200 },
  { address: 'GGHIJ3333444455556666', score: 43100 },
  { address: 'GHIJK7777888899990000', score: 32000 },
  { address: 'GIJKL1234432112344321', score: 21500 },
  { address: 'GJKLM9876678998766789', score: 10800 },
  { address: 'GKLMN5432123454321234', score: 5400  },
]

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

interface LeaderboardPanelProps {
  onClose: () => void
}

export function LeaderboardPanel({ onClose }: LeaderboardPanelProps) {
  const { address } = useWalletStore()
  const { onChainScore, sessionScore } = usePlayerStore()
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txHash, setTxHash] = useState<string | undefined>()
  const [txError, setTxError] = useState<string | undefined>()
  const [blinkOn, setBlinkOn] = useState(true)

  // Blink for player row
  useState(() => {
    const t = setInterval(() => setBlinkOn((b) => !b), 500)
    return () => clearInterval(t)
  })

  const { data: profile } = useQuery({
    queryKey: ['player', address],
    queryFn: () => axumClient.getPlayer(address!),
    enabled: !!address,
  })

  const leaders = address
    ? [...MOCK_LEADERS.slice(0, 9), { address, score: profile?.high_score ?? onChainScore }]
        .sort((a, b) => b.score - a.score).slice(0, 10)
    : MOCK_LEADERS

  const handleSync = async () => {
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

  const rankColor = (i: number) => {
    if (i === 0) return '#FAB005'
    if (i === 1) return '#AAAAAA'
    if (i === 2) return '#C88000'
    return '#FCFCFC'
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, background: 'rgba(0,0,0,0.8)' }}>
      <div
        className="modal-enter"
        style={{
          background: '#000',
          border: '4px solid #FAB005',
          padding: 24,
          width: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...S, fontSize: 10, color: '#FAB005' }}>🏆 HIGH SCORES</span>
          <button onClick={onClose} style={{ ...S, fontSize: 8, color: '#FCFCFC', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #FAB005' }}>
              <th style={{ ...S, fontSize: 6, color: '#7C7C7C', textAlign: 'left', padding: '4px 0', width: 24 }}>#</th>
              <th style={{ ...S, fontSize: 6, color: '#7C7C7C', textAlign: 'left', padding: '4px 0' }}>ADDRESS</th>
              <th style={{ ...S, fontSize: 6, color: '#7C7C7C', textAlign: 'right', padding: '4px 0' }}>SCORE</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((row, i) => {
              const isMe = address && row.address === address
              return (
                <tr
                  key={row.address}
                  style={{
                    borderBottom: '1px solid #1C1C1C',
                    background: isMe && blinkOn ? 'rgba(252,252,252,0.1)' : 'transparent',
                  }}
                >
                  <td style={{ ...S, fontSize: 7, color: rankColor(i), padding: '6px 0' }}>{i + 1}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: isMe ? '#FAB005' : '#FCFCFC', padding: '6px 0' }}>
                    {truncate(row.address)}{isMe ? ' ◄ YOU' : ''}
                  </td>
                  <td style={{ ...S, fontSize: 7, color: '#FAB005', textAlign: 'right', padding: '6px 0' }}>
                    {row.score.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Stats */}
        <div style={{ borderTop: '2px solid #FAB005', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: '#0C0C0C', border: '2px solid #3C3C3C', padding: 8 }}>
            <div style={{ ...S, fontSize: 6, color: '#7C7C7C', marginBottom: 4 }}>ON-CHAIN HIGH</div>
            <div style={{ ...S, fontSize: 9, color: '#FAB005' }}>{(profile?.high_score ?? onChainScore).toLocaleString()}</div>
          </div>
          <div style={{ background: '#0C0C0C', border: '2px solid #3C3C3C', padding: 8 }}>
            <div style={{ ...S, fontSize: 6, color: '#7C7C7C', marginBottom: 4 }}>SESSION BEST</div>
            <div style={{ ...S, fontSize: 9, color: '#FCFCFC' }}>{sessionScore.toLocaleString()}</div>
          </div>
        </div>

        {/* Sync button styled as flagpole */}
        <button
          onClick={handleSync}
          disabled={!address || !!txState}
          style={{
            ...S,
            fontSize: 8,
            background: !address || !!txState ? '#3C3C3C' : '#00A800',
            color: '#FCFCFC',
            border: 'none',
            padding: '12px',
            cursor: !address || !!txState ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          🚩 FLAG POLE — SYNC ON-CHAIN
        </button>
      </div>

      {txState && (
        <TxToast state={txState} txHash={txHash} error={txError} onClose={() => setTxState(null)} />
      )}
    </div>
  )
}
