/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_MODE?: 'local' | 'live'
  readonly VITE_AI_ENDPOINT?: string
  readonly VITE_AI_MODEL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
