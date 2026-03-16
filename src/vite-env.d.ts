/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USER_ID: string
  readonly VITE_USER_JWT: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_DEV_TOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __DEV_TOOLS_ENABLED__: boolean
