<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuery } from '@pinia/colada'
import IconShield from '~icons/mdi/shield-outline'
import { describeError } from '@/shared/api/errors'
import BaseErrorState from '@/shared/ui/BaseErrorState.vue'
import BaseSegmented from '@/shared/ui/BaseSegmented.vue'
import type { SelectOption } from '@/shared/ui/types'
import { SPORTSDB_SERVICE_NAME } from '../api/sportsDb.config'
import type { BadgeBackdrop, League } from '../model/league'
import { seasonBadgesQuery } from '../model/leagues.queries'
import { usePreferencesStore } from '../model/preferences.store'
import { formatSeason, latestSeasonWithBadge } from '../model/seasons'
import BadgeStage from './BadgeStage.vue'
import SeasonPicker from './SeasonPicker.vue'
import SportIcon from './SportIcon.vue'

const { league, headingId } = defineProps<{
  league: League
  /** Lets a surrounding dialog or region point aria-labelledby at the heading. */
  headingId?: string
}>()

// Leaf container: fetches its own data through the shared query cache, keyed by league id,
// so a slow response for a previous league can never overwrite the current one.
const {
  data: seasons,
  status,
  error,
  asyncStatus,
  refetch,
} = useQuery(() => seasonBadgesQuery(league.id))

const { badgeBackdrop } = storeToRefs(usePreferencesStore())
const backdropOptions: readonly SelectOption<BadgeBackdrop>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const chosenSeason = ref<string | null>(null)
watch(
  () => league.id,
  () => {
    chosenSeason.value = null
  },
)

const seasonList = computed(() => seasons.value ?? [])
const defaultSeason = computed(() => latestSeasonWithBadge(seasonList.value))
const currentSeason = computed(
  () =>
    seasonList.value.find((season) => season.season === chosenSeason.value && season.badgeUrl) ??
    defaultSeason.value,
)
const seasonModel = computed({
  get: () => currentSeason.value?.season ?? '',
  set: (season: string) => {
    chosenSeason.value = season
  },
})

const errorInfo = computed(() =>
  error.value ? describeError(error.value, SPORTSDB_SERVICE_NAME) : null,
)
const seasonCount = computed(() => {
  const count = seasonList.value.length
  return count === 1 ? '1 season' : `${count} seasons`
})
</script>

<template>
  <article class="grid gap-4" :aria-labelledby="headingId" :aria-busy="status === 'pending'">
    <header class="grid gap-1">
      <h2
        :id="headingId"
        class="text-xl leading-6 font-bold text-balance text-ink-strong"
        dir="auto"
      >
        {{ league.name }}
      </h2>
      <p class="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <SportIcon :sport="league.sport" class="size-4" />
        <span>{{ league.sport }}</span>
        <template v-if="status === 'success'"
          ><span aria-hidden="true">·</span> {{ seasonCount }}</template
        >
      </p>
      <p v-if="league.alternateNames.length" class="text-[13px] text-muted" dir="auto">
        Also known as {{ league.alternateNames.join(', ') }}
      </p>
    </header>

    <div v-if="status === 'pending'" class="grid gap-4" aria-label="Loading season badges">
      <div class="skeleton mx-auto aspect-square w-full max-w-[220px] rounded-xl" />
      <div class="flex flex-wrap gap-1.5">
        <div v-for="index in 5" :key="index" class="skeleton h-9 w-20 rounded-full" />
      </div>
    </div>

    <BaseErrorState
      v-else-if="status === 'error' && errorInfo"
      compact
      :title="errorInfo.title"
      :message="errorInfo.message"
      :retrying="asyncStatus === 'loading'"
      @retry="refetch()"
    />

    <template v-else-if="currentSeason?.badgeUrl">
      <div class="grid gap-2">
        <BadgeStage
          :url="currentSeason.badgeUrl"
          :alt="`${league.name} badge, ${formatSeason(currentSeason.season)} season`"
          :backdrop="badgeBackdrop"
        />
        <p class="text-center text-xs font-medium text-muted tabular-nums">
          Season {{ formatSeason(currentSeason.season) }}
          <template v-if="currentSeason === defaultSeason"> · latest with a badge</template>
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs font-medium text-muted" aria-hidden="true">Badge backdrop</span>
        <BaseSegmented v-model="badgeBackdrop" label="Badge backdrop" :options="backdropOptions" />
      </div>
      <SeasonPicker v-model="seasonModel" :seasons="seasonList" />
    </template>

    <template v-else>
      <div
        class="mx-auto grid aspect-square w-full max-w-[220px] place-items-center rounded-xl border border-dashed border-line-strong bg-[repeating-linear-gradient(135deg,var(--surface-2)_0_8px,var(--surface)_8px_16px)] text-line-strong"
      >
        <IconShield aria-hidden="true" class="size-12" />
      </div>
      <p class="text-center text-sm text-muted">
        <template v-if="seasonList.length">
          No season badges yet for {{ league.name }}. TheSportsDB is community-maintained, so some
          seasons don’t have artwork.
        </template>
        <template v-else>TheSportsDB doesn’t list any seasons for {{ league.name }}.</template>
      </p>
      <SeasonPicker v-if="seasonList.length" v-model="seasonModel" :seasons="seasonList" />
    </template>

    <p v-if="status === 'success' && seasonList.length" class="text-xs text-muted">
      The free API returns up to five seasons, oldest first.
    </p>
  </article>
</template>
