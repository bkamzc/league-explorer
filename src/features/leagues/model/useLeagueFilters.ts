import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { searchTokens } from '@/shared/lib/text'

/** A repeated query param (?q=a&q=b) arrives as an array; keep the first value. */
const firstString = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : Array.isArray(value) && typeof value[0] === 'string'
      ? value[0]
      : ''

export const SEARCH_DEBOUNCE_MS = 150

/**
 * Search and sport filters, kept in the URL (?q=&sport=) so a view can be shared,
 * survives a reload, and works with Back/Forward. Uses `replace`, so typing doesn't
 * fill the browser history.
 */
export function useLeagueFilters() {
  const queryParam = useRouteQuery<string, string>('q', '', {
    mode: 'replace',
    transform: firstString,
  })
  const sportParam = useRouteQuery<string, string>('sport', '', {
    mode: 'replace',
    transform: firstString,
  })

  /** Bound to the input so typing feels instant. */
  const query = ref(queryParam.value)
  /** What the list is filtered by: settles 150 ms after typing stops. */
  const appliedQuery = refDebounced(query, SEARCH_DEBOUNCE_MS)

  watch(appliedQuery, (value) => {
    queryParam.value = value.trim()
  })
  // Back/Forward or an edited URL: pull the new value into the input.
  watch(queryParam, (value) => {
    if (value !== appliedQuery.value.trim()) query.value = value
  })

  const tokens = computed(() => searchTokens(appliedQuery.value))

  const sport = computed({
    get: () => sportParam.value,
    set: (value: string) => {
      sportParam.value = value
    },
  })

  function clearQuery() {
    query.value = ''
    queryParam.value = ''
  }

  return { query, appliedQuery, tokens, sport, clearQuery }
}
