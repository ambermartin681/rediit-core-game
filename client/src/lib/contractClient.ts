import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  Horizon,
} from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE as string
const HORIZON_URL = import.meta.env.VITE_HORIZON_URL as string

const server = new Horizon.Server(HORIZON_URL)

export const contractClient = {
  updateScoreOnChain: async (playerAddress: string, score: number): Promise<string> => {
    if (!CONTRACT_ID) throw new Error('Contract ID not configured')

    const account = await server.loadAccount(playerAddress)
    const contract = new Contract(CONTRACT_ID)

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE || Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'update_score',
          new Address(playerAddress).toScVal(),
          nativeToScVal(score, { type: 'u64' }),
        ),
      )
      .setTimeout(30)
      .build()

    const signResult = await signTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE || Networks.TESTNET,
    })
    if (signResult.error) throw new Error(String(signResult.error))

    // @ts-expect-error stellar-sdk accepts signed XDR string
    const result = await server.submitTransaction(signResult.signedTxXdr)
    return result.hash
  },
}
