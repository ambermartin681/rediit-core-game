import {
  requestAccess,
  signTransaction,
  isConnected as freighterIsConnected,
} from '@stellar/freighter-api'
import { Horizon, StrKey } from '@stellar/stellar-sdk'

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL as string
const server = new Horizon.Server(HORIZON_URL)

export const stellarClient = {
  isFreighterConnected: async (): Promise<boolean> => {
    try {
      const result = await freighterIsConnected()
      return result.isConnected
    } catch {
      return false
    }
  },

  getPublicKey: async (): Promise<string> => {
    const result = await requestAccess()
    if (result.error) throw new Error(String(result.error))
    return result.address
  },

  getXLMBalance: async (address: string): Promise<number> => {
    if (!StrKey.isValidEd25519PublicKey(address)) return 0
    const account = await server.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return native ? parseFloat(native.balance) : 0
  },

  getTokenBalance: async (address: string, assetCode: string, issuer: string): Promise<number> => {
    if (!StrKey.isValidEd25519PublicKey(address)) return 0
    const account = await server.loadAccount(address)
    const token = account.balances.find(
      (b) =>
        b.asset_type !== 'native' &&
        'asset_code' in b &&
        b.asset_code === assetCode &&
        'asset_issuer' in b &&
        b.asset_issuer === issuer,
    )
    return token && 'balance' in token ? parseFloat(token.balance) : 0
  },

  signAndSubmit: async (xdr: string): Promise<string> => {
    const networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE as string
    const signResult = await signTransaction(xdr, { networkPassphrase })
    if (signResult.error) throw new Error(String(signResult.error))

    const tx = await server.submitTransaction(
      // @ts-expect-error stellar-sdk accepts signed XDR string
      signResult.signedTxXdr,
    )
    return tx.hash
  },
}

export { requestAccess, freighterIsConnected }
