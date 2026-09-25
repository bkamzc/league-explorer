/** Where the league list comes from: the live free API (5 leagues) or the bundled 2021 snapshot (584). */
export type LeagueSource = 'live' | 'sample'

export interface League {
  readonly id: string
  readonly name: string
  readonly sport: string
  readonly alternateNames: readonly string[]
  /** Folded name and alternate names, precomputed for matching. */
  readonly searchKey: string
}

export interface SeasonBadge {
  /** As the API writes it: "1992-1993" or "1967". */
  readonly season: string
  /** Validated https URL on TheSportsDB's image host, or null when the season has no badge. */
  readonly badgeUrl: string | null
}

export interface SportFacet {
  readonly sport: string
  readonly count: number
}

export type BadgeBackdrop = 'light' | 'dark'
