/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin. Defaults to '' so calls stay relative. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
