<script setup lang="ts">
import { computed } from 'vue'
import { refDebounced } from '@vueuse/core'

const {
  shown,
  total,
  query,
  sport,
  loading = false,
} = defineProps<{
  shown: number
  total: number
  query: string
  sport: string
  loading?: boolean
}>()

const plural = (count: number) => (count === 1 ? 'league' : 'leagues')

const summary = computed(() => {
  if (loading) return 'Loading leagues…'
  const q = query.trim()
  if (!q && !sport) return `${total} ${plural(total)}`
  if (shown === 0)
    return q ? `No leagues match “${q}”${sport ? ` in ${sport}` : ''}` : `No ${sport} leagues`
  const scope = sport ? ` in ${sport}` : ''
  return `${shown} of ${total} leagues${q ? ` match “${q}”` : ''}${scope}`
})

// Screen readers hear the settled result, not every intermediate count while typing.
const announcement = refDebounced(summary, 500)
</script>

<template>
  <p class="text-xs font-medium text-muted tabular-nums">
    <span aria-hidden="true">{{ summary }}</span>
    <span role="status" class="sr-only">{{ announcement }}</span>
  </p>
</template>
