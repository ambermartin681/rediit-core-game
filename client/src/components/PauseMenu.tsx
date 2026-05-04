import { useGameStore } from '@/stores/gameStore'
import { useWalletStore } from '@/stores/walletStore'
import { useNavigate } from 'react-router-dom'

interface PauseMenuProps {
  onResume: () => void
  onShop: () => void
  onLeaderboard: () => void
}

export function PauseMenu({ onResume, onShop, onLeaderboard }: PauseMenuProps) {
  const { scanlines, volume, toggleScanlines, setVolume } = useGameStore()
  const { disconnect } = useWalletStore()
  const navigate = useNavigate()

  const handleDisconnect = () => {
    disconnect()
    navigate('/')
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40">
      <div className="glass rounded-xl p-8 w-80 flex flex-col gap-4 modal-enter border border-primary">
        <h2 className="font-pixel text-primary text-center text-sm">PAUSED</h2>

        <button
          onClick={onResume}
          className="font-pixel text-xs bg-primary text-white py-3 hover:bg-purple-700 transition-colors"
        >
          ▶ RESUME
        </button>

        <button
          onClick={onShop}
          className="font-pixel text-xs border border-success text-success py-3 hover:bg-success hover:text-black transition-colors"
        >
          🛒 ITEM SHOP
        </button>

        <button
          onClick={onLeaderboard}
          className="font-pixel text-xs border border-accent text-accent py-3 hover:bg-accent hover:text-black transition-colors"
        >
          🏆 LEADERBOARD
        </button>

        <div className="border-t border-border pt-4 flex flex-col gap-3">
          <p className="font-pixel text-xs text-gray-400">SETTINGS</p>

          <label className="flex items-center justify-between">
            <span className="font-pixel text-xs text-gray-300">Scanlines</span>
            <button
              onClick={toggleScanlines}
              className={`w-10 h-5 rounded-full transition-colors ${scanlines ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${scanlines ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="font-pixel text-xs text-gray-300">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
          </label>
        </div>

        <button
          onClick={handleDisconnect}
          className="font-pixel text-xs border border-danger text-danger py-3 hover:bg-danger hover:text-white transition-colors mt-2"
        >
          ⏻ DISCONNECT
        </button>
      </div>
    </div>
  )
}
