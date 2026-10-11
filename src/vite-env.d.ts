/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the VSCMS API. Empty means "same origin" (Vite dev proxy). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
