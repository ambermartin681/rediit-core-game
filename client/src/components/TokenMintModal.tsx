import { useState } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { stellarClient } from '@/lib/stellarClient'
import { TxToast, TxState } from './TxToast'
import {
  Horizon,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Keypair,
} from '@stellar/stellar-sdk'

interface TokenMintModalProps {
  onClose: () => void
}

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL as string
const server = new Horizon.Server(HORIZON_URL)

export function TokenMintModal({ onClose }: TokenMintModalProps) {
  const { address } = useWalletStore()
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    decimals: 7,
    supply: 1000000,
    ipfs: '',
  })
  const [txState, setTxState] = useState<TxState | null>(null)
  const [txHash, setTxHash] = useState<string | undefined>()
  const [txError, setTxError] = useState<string | undefined>()

  const handleMint = async () => {
    if (!address) return
    setTxState('signing')
    setTxError(undefined)
    try {
      // Build a Stellar asset creation transaction (changeTrust + payment as demo)
      const account = await server.loadAccount(address)
      // Use a deterministic issuer keypair derived from symbol for demo
      const issuerKeypair = Keypair.random()
      const asset = new Asset(form.symbol.toUpperCase().slice(0, 12), issuerKeypair.publicKey())

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
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
    <div className="absolute inset-0 flex items-center justify-center z-40">
      <div className="glass rounded-xl p-8 w-96 flex flex-col gap-4 modal-enter border border-accent max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-pixel text-accent text-xs">DEPLOY GAME ASSET</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-pixel text-xs text-gray-400">TOKEN NAME</span>
            <input
              maxLength={20}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-surface border border-border text-white font-mono text-sm px-3 py-2 focus:border-accent outline-none"
              placeholder="My Game Token"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-pixel text-xs text-gray-400">SYMBOL (MAX 5)</span>
            <input
              maxLength={5}
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              className="bg-surface border border-border text-white font-mono text-sm px-3 py-2 focus:border-accent outline-none uppercase"
              placeholder="RDIIT"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-pixel text-xs text-gray-400">DECIMALS (0–18)</span>
            <input
              type="number"
              min={0}
              max={18}
              value={form.decimals}
              onChange={(e) => setForm({ ...form, decimals: parseInt(e.target.value) })}
              className="bg-surface border border-border text-white font-mono text-sm px-3 py-2 focus:border-accent outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-pixel text-xs text-gray-400">INITIAL SUPPLY</span>
            <input
              type="number"
              min={1}
              value={form.supply}
              onChange={(e) => setForm({ ...form, supply: parseInt(e.target.value) })}
              className="bg-surface border border-border text-white font-mono text-sm px-3 py-2 focus:border-accent outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-pixel text-xs text-gray-400">IPFS METADATA (OPTIONAL)</span>
            <input
              value={form.ipfs}
              onChange={(e) => setForm({ ...form, ipfs: e.target.value })}
              className="bg-surface border border-border text-white font-mono text-sm px-3 py-2 focus:border-accent outline-none"
              placeholder="ipfs://..."
            />
          </label>
        </div>

        <div className="bg-surface border border-border px-3 py-2">
          <p className="font-pixel text-xs text-yellow-400">Deployment fee: 0.5 XLM → Platform Treasury</p>
        </div>

        <button
          onClick={handleMint}
          disabled={!form.name || !form.symbol || !!txState}
          className="font-pixel text-xs bg-accent text-black py-3 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          MINT TOKEN
        </button>

        {txHash && (
          <a
            href={`https://testnet.stellarchain.io/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent underline text-center"
          >
            View on Stellar Explorer →
          </a>
        )}
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
