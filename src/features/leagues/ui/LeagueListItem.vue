<script setup lang="ts">
import IconChevronRight from '~icons/mdi/chevron-right'
import BaseHighlight from '@/shared/ui/BaseHighlight.vue'
import type { League } from '../model/league'
import SportIcon from './SportIcon.vue'

const {
  league,
  tokens,
  selected = false,
  opensDialog = false,
} = defineProps<{
  league: League
  tokens: readonly string[]
  selected?: boolean
  /** On small screens the details open in a sheet (a dialog). */
  opensDialog?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <button
    type="button"
    :data-league-id="league.id"
    :aria-current="selected ? 'true' : undefined"
    :aria-haspopup="opensDialog ? 'dialog' : undefined"
    class="row group relative grid min-h-14 w-full grid-cols-[32px_minmax(0,1fr)_20px] items-center gap-3 border-b border-line py-2 pr-3 pl-4 text-left text-ink-strong transition-colors duration-150 hover:bg-surface-2 active:bg-line"
    @click="emit('select', league.id)"
  >
    <span
      class="grid size-8 place-items-center rounded-full bg-surface-2 text-muted group-aria-[current=true]:text-accent"
    >
      <SportIcon :sport="league.sport" class="size-[18px]" />
    </span>
    <span class="min-w-0">
      <span
        class="line-clamp-2 text-[15px] leading-5 font-medium [overflow-wrap:anywhere]"
        dir="auto"
      >
        <BaseHighlight :text="league.name" :tokens />
      </span>
      <span
        v-if="league.alternateNames.length"
        class="block truncate text-[13px] leading-[18px] text-muted"
        dir="auto"
      >
        Also: <BaseHighlight :text="league.alternateNames.join(', ')" :tokens />
      </span>
    </span>
    <IconChevronRight
      aria-hidden="true"
      class="size-5 text-muted transition-transform duration-150 ease-standard group-hover:translate-x-0.5"
    />
  </button>
</template>

<style scoped>
.row[aria-current='true'] {
  background: var(--accent-subtle);
}
.row[aria-current='true'] > :nth-child(2) > :first-child {
  font-weight: 700;
}
.row[aria-current='true']::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 3px;
  background: var(--accent);
}
.row:focus-visible {
  outline-offset: -2px;
}
</style>
