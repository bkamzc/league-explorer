import type { SeasonBadge } from './league'

/** First four-digit year in the season label: "1992-1993" → 1992, "1967" → 1967. */
export function seasonStartYear(season: string): number {
  const year = /\d{4}/.exec(season)
  return year ? Number(year[0]) : Number.POSITIVE_INFINITY
}

/**
 * The season to show by default. The free tier returns the five *oldest* seasons, so the
 * latest one that actually has artwork is the most useful. Seasons are sorted oldest first.
 */
export function latestSeasonWithBadge(seasons: readonly SeasonBadge[]): SeasonBadge | null {
  return seasons.findLast((season) => season.badgeUrl !== null) ?? null
}

/** "1992-1993" → "1992–1993" (en dash, as in print). */
export function formatSeason(season: string): string {
  return season.replace(/(\d{4})-(\d{4})/, '$1–$2')
}

/**
 * Compact chip label: "1992-1993" → "1992–93". The full start year stays because some
 * leagues' seasons start in the 1890s, where "92–93" would read as the 1990s.
 */
export function formatSeasonShort(season: string): string {
  const match = /^(\d{4})-\d{2}(\d{2})$/.exec(season)
  return match ? `${match[1]}–${match[2]}` : season
}

export type BadgeSize = 'tiny' | 'small' | 'original'

/**
 * TheSportsDB serves resized images by suffix: /tiny ≈ 128 px, /small ≈ 256 px.
 * /medium 404s for archived badges, so it's never used.
 */
export function badgeVariantUrl(url: string, size: BadgeSize): string {
  return size === 'original' ? url : `${url}/${size}`
}
