import { useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { axumClient } from '@/lib/axumClient'
import { TxToast, TxState } from './TxToast'
import { drawToad } from '@/engine/MarioSprites'
import type { BuffType } from '@/stores/playerStore'

interface Item {
  id: string
  name: string
  cost: number
  desc: string
  buff: BuffType
  duration: number
}

const ITEMS: Item[] = [
  { id: 'item_01', name: 'SPEED MUSHROOM', cost: 2, desc: 'Move 50% faster', buff: 'Speed',      duration: 60000  },
  { id: 'item_02', name: 'SHIELD STAR',    cost: 5, desc: '+3 HP, i-frames',  buff: 'Shield',     duration: 300000 },
  { id: 'item_03', name: 'SCORE COIN ×2',  cost: 3, desc: '2× score mult',    buff: 'Multiplier', duration: 90000  },
  { id: 'item_04', name: 'INVISICAPE',     cost: 8, desc: 'Enemies ignore you',buff: 'Cloak',      duration: 30000  },
]

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

// Inline Toad canvas
function ToadIcon() {
  return (
    <canvas
      width={32}
      height={32}
      style={{ imageRendering: 'pixelated' }}
      ref={(el) => {
        if (!el) return
        const ctx = el.getContext('2d')
        if (!ctx) return
        drawToad(ctx, 0, 0)
      }}
    />
  )
}

interface ItemShopModalProps {
  onClose: () => void
}

export function ItemShopModal({ onClose }: ItemShopModalProps) {
  const { address, xlmBalance } = useWalletStore()
  const { activeBuffs, applyBuff } = usePlayerStore()
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txError, setTxError] = useState<string | undefined>()
  const [buying, setBuying] = useState<string | null>(null)

  const ownedBuffs = new Set(activeBuffs.map((b) => b.type))

  const handleBuy = async (item: Item) => {
    if (!address || buying) return
    setBuying(item.id)
    setTxState('submitting')
    setTxError(undefined)
    try {
      await axumClient.buyItem(address, item.id)
      applyBuff({ type: item.buff, expiresAt: Date.now() + item.duration })
      setTxState('confirmed')
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Purchase failed')
      setTxState('failed')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="modal-enter"
        style={{
          background: '#000040',
          border: '4px solid #FAB005',
          padding: 24,
          width: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ToadIcon />
            <span style={{ ...S, fontSize: 10, color: '#FCFCFC' }}>TOAD'S SHOP</span>
          </div>
          <button onClick={onClose} style={{ ...S, fontSize: 8, color: '#FCFCFC', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ ...S, fontSize: 7, color: '#FAB005', marginBottom: 16 }}>
          BALANCE: ▣ {xlmBalance.toFixed(2)} XLM
        </div>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {ITEMS.map((item) => {
            const owned = ownedBuffs.has(item.buff)
            const canAfford = xlmBalance >= item.cost
            return (
              <div
                key={item.id}
                className={`qblock-card${owned ? ' used' : ''}`}
                style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ ...S, fontSize: 7, color: owned ? '#FCFCFC' : '#000' }}>{item.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: owned ? '#AAAAAA' : '#382800' }}>{item.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ ...S, fontSize: 7, color: owned ? '#AAAAAA' : '#382800' }}>▣ {item.cost} XLM</span>
                  {owned ? (
                    <span style={{ ...S, fontSize: 6, color: '#00A800' }}>OWNED</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford || buying === item.id}
                      style={{
                        ...S,
                        fontSize: 6,
                        background: canAfford ? '#E40058' : '#5C5C5C',
                        color: '#FCFCFC',
                        border: 'none',
                        padding: '4px 8px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {buying === item.id ? '...' : 'BUY'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ ...S, fontSize: 6, color: '#7C7C7C', marginTop: 16, textAlign: 'center' }}>
          PRESS ↓ NEAR PIPE TO ENTER SHOP
        </div>
      </div>

      {txState && (
        <TxToast state={txState} error={txError} onClose={() => setTxState(null)} />
      )}
    </div>
  )
}
