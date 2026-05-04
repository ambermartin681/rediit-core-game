import { useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { stellarClient } from '@/lib/stellarClient'
import { TxToast, TxState } from './TxToast'
import {
  Horizon, TransactionBuilder, BASE_FEE, Networks, Operation, Asset, Keypair,
} from '@stellar/stellar-sdk'

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL as string
const server = new Horizon.Server(HORIZON_URL)

const S: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  WebkitFontSmoothing: 'none' as const,
  letterSpacing: '0.05em',
}

interface TokenMintModalProps {
  onClose: () => void
}

export function TokenMintModal({ onClose }: TokenMintModalProps) {
  const { address } = useWalletStore()
  const [form, setForm] = useState({ name: '', symbol: '', decimals: 7, supply: 1000000, ipfs: '' })
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txHash, setTxHash] = useState<string | undefined>()
  const [txError, setTxError] = useState<string | undefined>()

  const handleMint = async () => {
    if (!address) return
    setTxState('signing')
    setTxError(undefined)
    try {
      const account = await server.loadAccount(address)
      const issuerKeypair = Keypair.random()
      const asset = new Asset(form.symbol.toUpperCase().slice(0, 12), issuerKeypair.publicKey())
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.changeTrust({ asset, limit: String(form.supply) }))
        .setTimeout(30)
        .build()
      setTxState('submitting')
      const hash = await stellarClient.signAndSubmit(tx.toXDR())
      setTxHash(hash)
      setTxState('confirmed')
    } catch (e) {
      setTxError(e instanceof Error ? e.message : 'Mint failed')
      setTxState('failed')
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, background: 'rgba(0,0,0,0.8)' }}>
      <div
        className="modal-enter"
        style={{
          background: '#382800',
          border: '4px solid #FAB005',
          padding: 24,
          width: 380,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Brick border pattern top */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: 32, height: 16, background: '#E45C10', border: '1px solid #C84C0C' }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...S, fontSize: 10, color: '#FAB005' }}>▣ DEPLOY ASSET</span>
          <button onClick={onClose} style={{ ...S, fontSize: 8, color: '#FCFCFC', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Fields */}
        {[
          { label: 'TOKEN NAME', key: 'name', type: 'text', max: 20, placeholder: 'My Game Token' },
          { label: 'SYMBOL (MAX 5)', key: 'symbol', type: 'text', max: 5, placeholder: 'RDIIT' },
        ].map(({ label, key, type, max, placeholder }) => (
          <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ ...S, fontSize: 6, color: '#FAB005' }}>{label}</span>
            <input
              className="nes-input"
              type={type}
              maxLength={max}
              placeholder={placeholder}
              value={(form as Record<string, unknown>)[key] as string}
              onChange={(e) => setForm({ ...form, [key]: key === 'symbol' ? e.target.value.toUpperCase() : e.target.value })}
            />
          </label>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ ...S, fontSize: 6, color: '#FAB005' }}>DECIMALS</span>
            <input
              className="nes-input"
              type="number" min={0} max={18}
              value={form.decimals}
              onChange={(e) => setForm({ ...form, decimals: parseInt(e.target.value) })}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ ...S, fontSize: 6, color: '#FAB005' }}>SUPPLY</span>
            <input
              className="nes-input"
              type="number" min={1}
              value={form.supply}
              onChange={(e) => setForm({ ...form, supply: parseInt(e.target.value) })}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ ...S, fontSize: 6, color: '#FAB005' }}>IPFS METADATA (OPTIONAL)</span>
          <input
            className="nes-input"
            placeholder="ipfs://..."
            value={form.ipfs}
            onChange={(e) => setForm({ ...form, ipfs: e.target.value })}
          />
        </label>

        {/* Fee display */}
        <div style={{ background: '#000', border: '2px solid #FAB005', padding: '8px 12px' }}>
          <span style={{ ...S, fontSize: 7, color: '#FAB005' }}>▣▣▣▣▣ FEE: 0.5 XLM → TREASURY</span>
        </div>

        {/* Mint button */}
        <button
          onClick={handleMint}
          disabled={!form.name || !form.symbol || !!txState}
          style={{
            ...S,
            fontSize: 8,
            background: !form.name || !form.symbol || !!txState ? '#5C5C5C' : '#E40058',
            color: '#FCFCFC',
            border: 'none',
            padding: '12px',
            cursor: !form.name || !form.symbol || !!txState ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          ★ MINT TOKEN
        </button>

        {txHash && (
          <a
            href={`https://testnet.stellarchain.io/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FAB005', textAlign: 'center' }}
          >
            VIEW ON STELLAR EXPLORER →
          </a>
        )}

        {/* Brick border bottom */}
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: 32, height: 16, background: '#E45C10', border: '1px solid #C84C0C' }} />
          ))}
        </div>
      </div>

      {txState && (
        <TxToast state={txState} txHash={txHash} error={txError} onClose={() => setTxState(null)} />
      )}
    </div>
  )
}
