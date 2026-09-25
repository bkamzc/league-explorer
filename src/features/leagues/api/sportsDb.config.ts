/**
 * TheSportsDB settings. `3` is the key used in the assignment brief; like `123`, it's a
 * public free key. VITE_* values are bundled into the client, so a paid key would need
 * a server-side proxy instead.
 */
export const sportsDbConfig = {
  baseUrl: (
    import.meta.env.VITE_SPORTSDB_BASE_URL || 'https://www.thesportsdb.com/api/v1/json'
  ).replace(/\/+$/, ''),
  apiKey: import.meta.env.VITE_SPORTSDB_API_KEY || '3',
  /** Static copy of the 2021 all_leagues response (584 leagues), served from /public. */
  sampleLeaguesUrl: `${import.meta.env.BASE_URL}data/all_leagues.2021.json`,
} as const

export const SPORTSDB_SERVICE_NAME = 'TheSportsDB'
