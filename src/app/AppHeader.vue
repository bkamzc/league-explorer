<script setup lang="ts">
import { useOnline } from '@vueuse/core'
import IconWifiOff from '~icons/mdi/wifi-off'
import ThemeToggle from './ThemeToggle.vue'

const online = useOnline()
</script>

<template>
  <header class="bg-brand text-brand-ink">
    <div class="mx-auto flex min-h-14 max-w-[1240px] items-center gap-3 px-4 lg:px-6">
      <span
        aria-hidden="true"
        class="grid size-8 place-items-center rounded-lg bg-white text-lg font-extrabold text-brand"
      >
        S
      </span>
      <p class="flex-1 text-lg font-bold tracking-[0.01em]">League Explorer</p>
      <p
        v-if="!online"
        role="status"
        class="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-medium"
      >
        <IconWifiOff aria-hidden="true" class="size-4" />
        Offline: showing cached data
      </p>
      <ThemeToggle />
    </div>
  </header>
</template>
