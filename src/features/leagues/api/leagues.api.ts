import { getJson } from '@/shared/api/http'
import type { League, LeagueSource, SeasonBadge } from '../model/league'
import { toLeagues, toSeasonBadges } from './leagues.mapper'
import { parseLeaguesResponse, parseSeasonsResponse } from './leagues.schema'
import { sportsDbConfig } from './sportsDb.config'

interface RequestOptions {
  signal?: AbortSignal
}

export const LEAGUE_ID_PATTERN = /^\d+$/

function sportsDbUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(
    `${sportsDbConfig.baseUrl}/${encodeURIComponent(sportsDbConfig.apiKey)}/${endpoint}`,
  )
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.href
}

/**
 * All leagues from the live API, or from the bundled 2021 snapshot. The snapshot is the
 * same response shape, so both go through the same validation and mapping.
 */
export async function fetchLeagues(
  source: LeagueSource,
  { signal }: RequestOptions = {},
): Promise<readonly League[]> {
  const url = source === 'live' ? sportsDbUrl('all_leagues.php') : sportsDbConfig.sampleLeaguesUrl
  return toLeagues(parseLeaguesResponse(await getJson(url, { signal })))
}

/** Seasons for one league, oldest first. The free tier returns at most five. */
export async function fetchSeasonBadges(
  leagueId: string,
  { signal }: RequestOptions = {},
): Promise<readonly SeasonBadge[]> {
  // The id comes from the URL (?league=), so it's user input: never pass it through unchecked.
  if (!LEAGUE_ID_PATTERN.test(leagueId)) throw new RangeError(`Invalid league id "${leagueId}"`)
  const url = sportsDbUrl('search_all_seasons.php', { badge: '1', id: leagueId })
  return toSeasonBadges(parseSeasonsResponse(await getJson(url, { signal })))
}
