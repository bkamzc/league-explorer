import { defineQueryOptions } from '@pinia/colada'
import { fetchLeagues, fetchSeasonBadges } from '../api/leagues.api'
import type { LeagueSource } from './league'

/**
 * The brief says responses must be cached to avoid repeat calls. Pinia Colada's defaults
 * (5 s staleTime, 5 min gcTime, refetch on focus/reconnect) would re-request, so:
 * - staleTime Infinity + gcTime false: one successful request per key for the whole session.
 * - refetchOnMount stays on: Colada only refreshes entries that are stale *or failed*, so a
 *   cached success is never re-requested, while a failed league retries when reopened.
 * - no refetch on focus/reconnect: the free API allows 30 requests a minute.
 */
export const SESSION_CACHE = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

export const leaguesQuery = defineQueryOptions((source: LeagueSource) => ({
  key: ['leagues', source],
  query: ({ signal }) => fetchLeagues(source, { signal }),
  ...SESSION_CACHE,
}))

export const seasonBadgesQuery = defineQueryOptions((leagueId: string) => ({
  key: ['season-badges', leagueId],
  query: ({ signal }) => fetchSeasonBadges(leagueId, { signal }),
  ...SESSION_CACHE,
}))
