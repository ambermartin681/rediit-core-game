/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AXUM_SERVER: string
  readonly VITE_HORIZON_URL: string
  readonly VITE_CONTRACT_ID: string
  readonly VITE_NETWORK_PASSPHRASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
