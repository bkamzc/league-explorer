<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useIntersectionObserver, usePreferredReducedMotion } from '@vueuse/core'
import type { League, SportFacet } from '../model/league'
import { groupBySport } from '../model/filterLeagues'
import LeagueListItem from './LeagueListItem.vue'

const {
  leagues,
  facets,
  tokens,
  selectedId = null,
  opensDialog = false,
} = defineProps<{
  /** Already filtered and sorted. */
  leagues: readonly League[]
  /** Sport order for the groups. */
  facets: readonly SportFacet[]
  tokens: readonly string[]
  selectedId?: string | null
  opensDialog?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()

/*
 * Render window: 60 rows, growing as the user scrolls. Keeps the first paint cheap on
 * low-end phones with the 584-league sample. Virtualisation isn't worth it at this size.
 */
const PAGE_SIZE = 60
const limit = ref(PAGE_SIZE)
watch(
  () => leagues,
  () => {
    limit.value = PAGE_SIZE
  },
)

const visible = computed(() => leagues.slice(0, limit.value))
const remaining = computed(() => leagues.length - visible.value.length)

const groupSizes = computed(() => {
  const sizes = new Map<string, number>()
  for (const league of leagues) sizes.set(league.sport, (sizes.get(league.sport) ?? 0) + 1)
  return sizes
})

type Row =
  | { kind: 'header'; key: string; sport: string; count: number }
  | { kind: 'league'; key: string; league: League }

// One flat list (headers included) so a single TransitionGroup can animate every row.
const rows = computed<Row[]>(() =>
  groupBySport(visible.value, facets).flatMap(({ sport, leagues: group }) => [
    {
      kind: 'header',
      key: `h:${sport}`,
      sport,
      count: groupSizes.value.get(sport) ?? group.length,
    },
    ...group.map((league): Row => ({ kind: 'league', key: league.id, league })),
  ]),
)

/*
 * Animate only small changes. Measured: TransitionGroup with Vue's documented recipe
 * blocks the main thread ~3.4 s when 900 rows leave at once (one forced layout per
 * leaving row). With `:css="false"` large changes swap instantly (~12 ms), and the list
 * gets a single cheap opacity cue instead.
 */
const MAX_ANIMATED_CHANGES = 24
const reducedMotion = usePreferredReducedMotion()
const animate = ref(false)
const listRef = useTemplateRef<HTMLElement>('list')

watch(
  () => rows.value.map((row) => row.key),
  (next, previous = []) => {
    const before = new Set(previous)
    const after = new Set(next)
    let changes = 0
    for (const key of after) if (!before.has(key)) changes++
    for (const key of before) if (!after.has(key)) changes++

    const motionAllowed = reducedMotion.value !== 'reduce'
    animate.value = motionAllowed && previous.length > 0 && changes <= MAX_ANIMATED_CHANGES
    if (motionAllowed && !animate.value && previous.length > 0) {
      listRef.value?.animate?.([{ opacity: 0.55 }, { opacity: 1 }], {
        duration: 150,
        easing: 'ease-out',
      })
    }
  },
)

// First paint: the first 12 rows rise in 30 ms apart; later rows appear instantly.
const firstPaint = ref(true)
onMounted(() => setTimeout(() => (firstPaint.value = false), 800))

const sentinel = useTemplateRef<HTMLElement>('sentinel')
useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting && remaining.value > 0) limit.value += PAGE_SIZE
  },
  { rootMargin: '600px 0px' },
)
</script>

<template>
  <div ref="list" :class="{ stagger: firstPaint }">
    <TransitionGroup
      tag="ul"
      :name="animate ? 'row' : 'row-off'"
      :css="animate"
      class="relative"
      aria-label="Leagues"
    >
      <li
        v-for="(row, index) in rows"
        :key="row.key"
        :class="row.kind === 'header' ? 'sticky top-(--filters-h) z-10' : undefined"
        :style="index < 12 ? { '--i': index } : undefined"
      >
        <h2
          v-if="row.kind === 'header'"
          class="border-b border-line bg-surface-2 px-4 py-2 text-[11px] leading-4 font-bold tracking-[0.07em] text-muted uppercase tabular-nums"
        >
          {{ row.sport }} · {{ row.count }}
        </h2>
        <LeagueListItem
          v-else
          :league="row.league"
          :tokens
          :selected="row.league.id === selectedId"
          :opens-dialog="opensDialog"
          @select="emit('select', $event)"
        />
      </li>
    </TransitionGroup>

    <div
      v-if="remaining > 0"
      ref="sentinel"
      class="grid place-items-center border-b border-line p-3"
    >
      <button
        type="button"
        class="h-10 rounded border border-line-strong px-4 text-sm font-semibold text-ink-strong hover:bg-surface-2"
        @click="limit += PAGE_SIZE"
      >
        Show more ({{ remaining }} left)
      </button>
    </div>
  </div>
</template>

<style scoped>
.row-move,
.row-enter-active {
  transition:
    transform var(--motion-duration-md) var(--motion-ease-standard),
    opacity var(--motion-duration-md) var(--motion-ease-standard);
}
.row-leave-active {
  position: absolute;
  inset-inline: 0;
  transition: opacity var(--motion-duration-sm) var(--motion-ease-exit);
}
.row-enter-from {
  opacity: 0;
  transform: translateY(var(--motion-distance-md));
}
.row-leave-to {
  opacity: 0;
}
.stagger li {
  animation: row-in var(--motion-duration-md) var(--motion-ease-enter) both;
  animation-delay: calc(var(--i, 12) * var(--motion-stagger));
}
/* Reduced motion: the first-load reveal is decoration, so rows simply appear. */
@media (prefers-reduced-motion: reduce) {
  .stagger li {
    animation: none;
  }
}
@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(var(--motion-distance-md));
  }
}
</style>
