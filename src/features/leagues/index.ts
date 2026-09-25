// Public API of the leagues feature. Pages import from here, not from internal files.
export { SPORTSDB_SERVICE_NAME } from './api/sportsDb.config'
export type { League, LeagueSource, SeasonBadge, SportFacet } from './model/league'
export { filterLeagues, sportFacets } from './model/filterLeagues'
export { leaguesQuery, seasonBadgesQuery } from './model/leagues.queries'
export { usePreferencesStore } from './model/preferences.store'
export { useLeagueFilters } from './model/useLeagueFilters'
export { useLeagueSelection } from './model/useLeagueSelection'
export { default as DataSourceSwitch } from './ui/DataSourceSwitch.vue'
export { default as LeagueDetail } from './ui/LeagueDetail.vue'
export { default as LeagueFilters } from './ui/LeagueFilters.vue'
export { default as LeagueList } from './ui/LeagueList.vue'
export { default as LeagueListSkeleton } from './ui/LeagueListSkeleton.vue'
export { default as LeagueResultSummary } from './ui/LeagueResultSummary.vue'

/** The mobile sheet (and Reka UI with it) is a separate chunk: desktop never downloads it. */
export const loadLeagueDetailSheet = () => import('./ui/LeagueDetailSheet.vue')
