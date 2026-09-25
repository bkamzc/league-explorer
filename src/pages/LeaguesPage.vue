<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useTemplateRef, watch, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuery } from '@pinia/colada'
import { useElementSize, useMediaQuery, useTitle } from '@vueuse/core'
import IconInformation from '~icons/mdi/information-outline'
import IconMagnify from '~icons/mdi/magnify'
import IconTrophy from '~icons/mdi/trophy-outline'
import { describeError } from '@/shared/api/errors'
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue'
import BaseErrorState from '@/shared/ui/BaseErrorState.vue'
import {
  DataSourceSwitch,
  LeagueDetail,
  LeagueFilters,
  LeagueList,
  LeagueListSkeleton,
  LeagueResultSummary,
  SPORTSDB_SERVICE_NAME,
  filterLeagues,
  leaguesQuery,
  loadLeagueDetailSheet,
  sportFacets,
  useLeagueFilters,
  useLeagueSelection,
  usePreferencesStore,
  type League,
} from '@/features/leagues'

// Rendered (and therefore downloaded) only below 1024 px, right after first paint.
const LeagueDetailSheet = defineAsyncComponent(loadLeagueDetailSheet)

// Server state: the query cache. Client state: the preferences store. View state: the URL.
const { source } = storeToRefs(usePreferencesStore())
const { data, status, error, asyncStatus, refetch } = useQuery(() => leaguesQuery(source.value))

const leagues = computed(() => data.value ?? [])
const facets = computed(() => sportFacets(leagues.value))

const { query, appliedQuery, tokens, sport, clearQuery } = useLeagueFilters()

// A sport in the URL that isn't in the loaded data (e.g. after switching source) means "all".
const activeSport = computed(() =>
  facets.value.some((facet) => facet.sport === sport.value) ? sport.value : '',
)
const sportModel = computed({
  get: () => activeSport.value,
  set: (value: string) => {
    sport.value = value
  },
})

const filtered = computed(() =>
  filterLeagues(leagues.value, { tokens: tokens.value, sport: activeSport.value }),
)
const matchesInOtherSports = computed(() =>
  activeSport.value && tokens.value.length
    ? filterLeagues(leagues.value, { tokens: tokens.value, sport: '' }).length
    : 0,
)

const isWide = useMediaQuery('(min-width: 1024px)')
const { selectedId, select, clear } = useLeagueSelection({ pushHistory: () => !isWide.value })
const selectedLeague = computed(
  () => leagues.value.find((league) => league.id === selectedId.value) ?? null,
)

// Ignore a ?league= that isn't in the loaded list.
watch([selectedId, status], () => {
  if (status.value === 'success' && selectedId.value && !selectedLeague.value) clear()
})

// Keep the last league in the sheet while it animates closed.
const sheetLeague = ref<League | null>(null)
watch(selectedLeague, (league) => {
  if (league) sheetLeague.value = league
})
const sheetOpen = computed({
  get: () => !isWide.value && selectedLeague.value !== null,
  set: (open: boolean) => {
    if (!open) clear()
  },
})
const rowFor = (id: string | undefined) =>
  id ? document.querySelector<HTMLElement>(`[data-league-id="${id}"]`) : null

// Sticky group headers sit under the sticky filter bar, whatever height it wraps to.
const filterBar = useTemplateRef<HTMLElement>('filterBar')
const { height: filterBarHeight } = useElementSize(filterBar, undefined, { box: 'border-box' })
watchEffect(() =>
  document.documentElement.style.setProperty(
    '--filters-h',
    `${Math.round(filterBarHeight.value)}px`,
  ),
)

useTitle(
  computed(() =>
    selectedLeague.value
      ? `${selectedLeague.value.name} · League Explorer`
      : 'League Explorer · Sports leagues',
  ),
)

const listError = computed(() =>
  error.value ? describeError(error.value, SPORTSDB_SERVICE_NAME) : null,
)

const freeTierNote = computed(() => {
  if (source.value !== 'live' || status.value !== 'success') return ''
  const only = facets.value.length === 1 ? `, all ${facets.value[0]!.sport}` : ''
  return `TheSportsDB’s free API currently returns ${leagues.value.length} leagues${only}. Switch the data to the 2021 sample (584 leagues, 21 sports) to try search and sport filtering at scale. Badges still load live.`
})

const emptyDescription = computed(() => {
  const q = appliedQuery.value.trim()
  if (!q) return `No ${activeSport.value} leagues in this data.`
  return `Nothing matches “${q}”${activeSport.value ? ` in ${activeSport.value}` : ''}.`
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1240px] px-4 lg:px-6">
    <div class="pt-5 pb-2">
      <h1 class="text-2xl leading-8 font-bold text-ink-strong">Leagues</h1>
      <p class="text-sm text-muted">
        Search or filter by sport, then open a league to see its season badges.
      </p>
    </div>

    <div
      ref="filterBar"
      role="search"
      aria-label="Filter leagues"
      class="sticky top-0 z-20 -mx-4 bg-bg/95 px-4 pt-2 pb-2 backdrop-blur-sm lg:-mx-6 lg:px-6"
    >
      <LeagueFilters
        v-model:query="query"
        v-model:sport="sportModel"
        :facets
        :total-count="leagues.length"
        :loading="status === 'pending'"
        @clear-query="clearQuery"
      />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1 pb-3">
      <LeagueResultSummary
        :shown="filtered.length"
        :total="leagues.length"
        :query="appliedQuery"
        :sport="activeSport"
        :loading="status === 'pending'"
      />
      <DataSourceSwitch v-model="source" />
    </div>

    <p
      v-if="freeTierNote"
      class="mb-3 flex gap-2 rounded border border-line bg-surface px-3 py-2 text-[13px] text-muted"
    >
      <IconInformation aria-hidden="true" class="mt-px size-4 shrink-0" />
      <span>{{ freeTierNote }}</span>
    </p>

    <div class="grid items-start gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-label="League results" class="rounded-md border border-line bg-surface">
        <LeagueListSkeleton v-if="status === 'pending'" />
        <BaseErrorState
          v-else-if="status === 'error' && listError"
          :title="listError.title"
          :message="listError.message"
          :retrying="asyncStatus === 'loading'"
          @retry="refetch()"
        />
        <BaseEmptyState
          v-else-if="!filtered.length"
          title="No leagues found"
          :description="emptyDescription"
        >
          <template #icon><IconMagnify aria-hidden="true" /></template>
          <template #actions>
            <button
              v-if="appliedQuery.trim()"
              type="button"
              class="h-10 rounded border border-line-strong px-4 text-sm font-semibold text-ink-strong hover:bg-surface-2"
              @click="clearQuery"
            >
              Clear search
            </button>
            <button
              v-if="matchesInOtherSports"
              type="button"
              class="h-10 rounded bg-accent px-4 text-sm font-semibold text-accent-ink hover:brightness-110"
              @click="sportModel = ''"
            >
              Search all sports ({{ matchesInOtherSports }})
            </button>
          </template>
        </BaseEmptyState>
        <LeagueList
          v-else
          :leagues="filtered"
          :facets
          :tokens
          :selected-id="selectedId"
          :opens-dialog="!isWide"
          @select="select"
        />
      </section>

      <aside
        v-if="isWide"
        aria-label="League details"
        class="sticky top-[calc(var(--filters-h)+12px)] rounded-md border border-line bg-surface p-5"
      >
        <LeagueDetail v-if="selectedLeague" :league="selectedLeague" heading-id="detail-title" />
        <div
          v-else
          class="grid min-h-[320px] place-content-center justify-items-center gap-3 text-center text-muted"
        >
          <IconTrophy aria-hidden="true" class="size-10 text-line-strong" />
          <p class="max-w-[26ch] text-sm">Select a league to see its season badges.</p>
        </div>
      </aside>
    </div>

    <LeagueDetailSheet
      v-if="!isWide"
      v-model:open="sheetOpen"
      :title="sheetLeague?.name ?? 'League details'"
      :return-focus-to="() => rowFor(sheetLeague?.id)"
    >
      <LeagueDetail v-if="sheetLeague" :league="sheetLeague" />
    </LeagueDetailSheet>
  </div>
</template>
