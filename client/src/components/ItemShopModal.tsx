import { useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { usePlayerStore } from '@/stores/playerStore'
import { axumClient } from '@/lib/axumClient'
import { TxToast, TxState } from './TxToast'
import type { BuffType } from '@/stores/playerStore'

interface Item {
  id: string
  name: string
  cost: number
  description: string
  buff: BuffType
  duration: number
  icon: string
}

const ITEMS: Item[] = [
  { id: 'item_01', name: 'Speed Boost',      cost: 2, description: 'Move 50% faster for 60 seconds',       buff: 'Speed',      duration: 60000,  icon: '⚡' },
  { id: 'item_02', name: 'Shield Module',    cost: 5, description: '+3 HP blocks, lasts until hit',         buff: 'Shield',     duration: 300000, icon: '🛡' },
  { id: 'item_03', name: 'Score Multiplier', cost: 3, description: '2× score for 90 seconds',               buff: 'Multiplier', duration: 90000,  icon: '×2' },
  { id: 'item_04', name: 'Stellar Cloak',    cost: 8, description: 'Invisible to enemies for 30 seconds',   buff: 'Cloak',      duration: 30000,  icon: '👁' },
]

interface ItemShopModalProps {
  onClose: () => void
}

export function ItemShopModal({ onClose }: ItemShopModalProps) {
  const { address, xlmBalance } = useWalletStore()
  const { activeBuffs, applyBuff } = usePlayerStore()
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txError, setTxError] = useState<string | undefined>()
  const [buying, setBuying] = useState<string | null>(null)

  const ownedBuffTypes = new Set(activeBuffs.map((b) => b.type))

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
    <div className="absolute inset-0 flex items-center justify-center z-40">
      <div className="glass rounded-xl p-8 w-[480px] flex flex-col gap-4 modal-enter border border-success">
        <div className="flex items-center justify-between">
          <h2 className="font-pixel text-success text-xs">ITEM SHOP</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <p className="font-mono text-xs text-gray-400">Balance: <span className="text-success">{xlmBalance.toFixed(4)} XLM</span></p>

        <div className="grid grid-cols-2 gap-3">
          {ITEMS.map((item) => {
            const owned = ownedBuffTypes.has(item.buff)
            const canAfford = xlmBalance >= item.cost
            return (
              <div
                key={item.id}
                className={`bg-surface p-4 flex flex-col gap-2 border transition-colors ${owned ? 'border-success' : 'border-border hover:border-accent'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  {owned && (
                    <span className="font-pixel text-xs text-success bg-success/10 px-1">OWNED</span>
                  )}
                </div>
                <p className="font-pixel text-xs text-white">{item.name}</p>
                <p className="font-ui text-xs text-gray-400">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-mono text-xs text-success">{item.cost} XLM</span>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || buying === item.id}
                    className="font-pixel text-xs bg-primary text-white px-3 py-1 hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {buying === item.id ? '...' : 'BUY'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {txState && (
        <TxToast
          state={txState}
          error={txError}
          onClose={() => setTxState(null)}
        />
      )}
    </div>
  )
}
