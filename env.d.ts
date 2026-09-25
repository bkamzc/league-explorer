/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

interface ImportMetaEnv {
  /** TheSportsDB v1 base URL, without the key. */
  readonly VITE_SPORTSDB_BASE_URL?: string
  /** TheSportsDB API key. `3` (used in the brief) and `123` are public free keys. It ships to the browser, so never put a paid key here. */
  readonly VITE_SPORTSDB_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
