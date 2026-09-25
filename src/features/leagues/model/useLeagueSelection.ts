import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LEAGUE_ID_PATTERN } from '../api/leagues.api'

/**
 * The selected league lives in the URL (?league=4328).
 * On small screens opening a league *pushes* a history entry, so the phone's Back button
 * closes the sheet. In the desktop split view it *replaces*, so browsing leagues doesn't
 * bury the previous page under dozens of history entries.
 */
export function useLeagueSelection(options: { pushHistory: MaybeRefOrGetter<boolean> }) {
  const route = useRoute()
  const router = useRouter()

  const selectedId = computed<string | null>(() => {
    const value = route.query.league
    // User-controlled input: only numeric ids are ever used.
    return typeof value === 'string' && LEAGUE_ID_PATTERN.test(value) ? value : null
  })

  function select(id: string) {
    if (id === selectedId.value) return
    const location = { query: { ...route.query, league: id } }
    // Replace when switching between leagues so Back still goes to the list, not the previous league.
    if (toValue(options.pushHistory) && !selectedId.value) void router.push(location)
    else void router.replace(location)
  }

  function clear() {
    if (!selectedId.value) return
    const back = router.options.history.state.back
    const previous = typeof back === 'string' ? router.resolve(back) : null
    // If the previous entry is this list without a league, go back to it instead of adding one.
    if (previous && previous.path === route.path && previous.query.league === undefined)
      router.back()
    else void router.replace({ query: { ...route.query, league: undefined } })
  }

  return { selectedId, select, clear }
}
