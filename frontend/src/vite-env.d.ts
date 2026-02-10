/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_AI_SERVICE_URL: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_ENABLE_SERVICE_WORKER: string
  readonly VITE_SYNC_INTERVAL_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
