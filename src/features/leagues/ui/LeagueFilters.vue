<script setup lang="ts">
import { computed } from 'vue'
import BaseSearchInput from '@/shared/ui/BaseSearchInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { SelectOption } from '@/shared/ui/types'
import type { SportFacet } from '../model/league'
import SportIcon from './SportIcon.vue'

const {
  facets,
  totalCount,
  loading = false,
} = defineProps<{
  facets: readonly SportFacet[]
  totalCount: number
  loading?: boolean
}>()

const emit = defineEmits<{ clearQuery: [] }>()

const query = defineModel<string>('query', { required: true })
const sport = defineModel<string>('sport', { required: true })

const MAX_CHIPS = 6

const sportOptions = computed<SelectOption[]>(() =>
  loading
    ? [{ value: '', label: 'Loading sports…' }]
    : [
        { value: '', label: `All sports (${totalCount})` },
        ...facets.map(({ sport: name, count }) => ({ value: name, label: `${name} (${count})` })),
      ],
)

// Quick chips mirror the dropdown for the most common sports. Pointless with one or two sports.
const chips = computed<SportFacet[]>(() =>
  facets.length > 2 ? [{ sport: '', count: totalCount }, ...facets.slice(0, MAX_CHIPS)] : [],
)
</script>

<template>
  <div class="grid gap-2">
    <div
      class="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] md:items-center md:gap-3"
    >
      <BaseSearchInput
        v-model="query"
        label="Search leagues"
        placeholder="Search leagues (e.g. Premier League)"
        hint="Matches league names and alternate names. Press slash to focus."
        shortcut="/"
        @clear="emit('clearQuery')"
      />
      <BaseSelect v-model="sport" label="Sport" :options="sportOptions" :disabled="loading" />
    </div>

    <div
      v-if="chips.length"
      role="group"
      aria-label="Popular sports"
      class="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
    >
      <button
        v-for="chip in chips"
        :key="chip.sport || 'all'"
        type="button"
        :aria-pressed="sport === chip.sport"
        class="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface pr-3 pl-2.5 text-[13px] font-medium text-ink transition-[background-color,color,transform] duration-150 hover:bg-surface-2 active:scale-(--motion-scale-press) aria-pressed:border-ink-strong aria-pressed:bg-ink-strong aria-pressed:text-surface"
        @click="sport = chip.sport"
      >
        <SportIcon v-if="chip.sport" :sport="chip.sport" class="size-4" />
        <span>{{ chip.sport || 'All' }}</span>
        <span class="tabular-nums opacity-70">{{ chip.count }}</span>
      </button>
    </div>
  </div>
</template>
