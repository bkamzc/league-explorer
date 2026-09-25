<script setup lang="ts">
import BaseSegmented from '@/shared/ui/BaseSegmented.vue'
import type { SelectOption } from '@/shared/ui/types'
import type { LeagueSource } from '../model/league'

const source = defineModel<LeagueSource>({ required: true })

const options: readonly SelectOption<LeagueSource>[] = [
  { value: 'live', label: 'Live API' },
  { value: 'sample', label: '2021 sample' },
]
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-xs font-medium text-muted" aria-hidden="true">Data</span>
    <BaseSegmented v-model="source" label="Data source" :options />
  </div>
</template>
