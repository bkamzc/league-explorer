<script setup lang="ts">
import type { SeasonBadge } from '../model/league'
import { badgeVariantUrl, formatSeason, formatSeasonShort } from '../model/seasons'

const { seasons } = defineProps<{ seasons: readonly SeasonBadge[] }>()

const selected = defineModel<string>({ required: true })

function choose(season: SeasonBadge) {
  // Seasons without artwork stay focusable (so the gap is discoverable) but can't be chosen.
  if (season.badgeUrl) selected.value = season.season
}
</script>

<template>
  <div>
    <p class="mb-2 text-xs font-medium text-muted" aria-hidden="true">Season</p>
    <div role="group" aria-label="Season" class="flex flex-wrap gap-1.5">
      <button
        v-for="season in seasons"
        :key="season.season"
        type="button"
        :aria-pressed="selected === season.season"
        :aria-disabled="season.badgeUrl ? undefined : 'true'"
        :aria-label="`${formatSeason(season.season)}${season.badgeUrl ? '' : ', no badge'}`"
        class="chip inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface pr-3 pl-1 text-xs font-medium text-ink tabular-nums transition-colors duration-150 hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:text-muted aria-disabled:hover:bg-surface"
        @click="choose(season)"
      >
        <img
          v-if="season.badgeUrl"
          :src="badgeVariantUrl(season.badgeUrl, 'tiny')"
          alt=""
          width="24"
          height="24"
          decoding="async"
          class="size-7 rounded-full bg-white object-contain p-0.5"
        />
        <span v-else class="size-7 rounded-full border border-dashed border-line-strong" />
        {{ formatSeasonShort(season.season) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chip[aria-pressed='true'] {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
  color: var(--ink-strong);
  font-weight: 700;
}
</style>
