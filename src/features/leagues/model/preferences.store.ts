import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { BadgeBackdrop, LeagueSource } from './league'

/**
 * Client-side preferences shared across the page. Server data lives in the Colada query
 * cache and filters live in the URL, so this store only holds what the user chose.
 * Values read back from storage are validated because anything can be in localStorage.
 */
export const usePreferencesStore = defineStore('preferences', () => {
  const storedSource = useStorage<string>('league-explorer:source', 'live')
  const storedBackdrop = useStorage<string>('league-explorer:badge-backdrop', 'light')

  const source = computed<LeagueSource>({
    get: () => (storedSource.value === 'sample' ? 'sample' : 'live'),
    set: (value) => {
      storedSource.value = value
    },
  })

  const badgeBackdrop = computed<BadgeBackdrop>({
    get: () => (storedBackdrop.value === 'dark' ? 'dark' : 'light'),
    set: (value) => {
      storedBackdrop.value = value
    },
  })

  return { source, badgeBackdrop }
})
