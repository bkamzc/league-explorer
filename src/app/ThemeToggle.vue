<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useColorMode } from '@vueuse/core'
import IconAuto from '~icons/mdi/theme-light-dark'
import IconLight from '~icons/mdi/white-balance-sunny'
import IconDark from '~icons/mdi/weather-night'

type Choice = 'auto' | 'light' | 'dark'

const mode = useColorMode({
  attribute: 'data-theme',
  // Must match public/theme-init.js, which applies the theme before first paint.
  storageKey: 'league-explorer:theme',
  // VueUse's version injects a <style> tag, which the CSP blocks; do it with a class instead.
  disableTransition: false,
  onChanged(value, defaultHandler) {
    const root = document.documentElement
    root.classList.add('theme-switching')
    defaultHandler(value)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('theme-switching')),
    )
  },
})

const next: Record<Choice, Choice> = { auto: 'light', light: 'dark', dark: 'auto' }
const labels: Record<Choice, string> = { auto: 'System', light: 'Light', dark: 'Dark' }
const icons: Record<Choice, Component> = { auto: IconAuto, light: IconLight, dark: IconDark }

const { store } = mode
const current = computed<Choice>(() => (store.value in labels ? (store.value as Choice) : 'auto'))

function cycle() {
  store.value = next[current.value]
}
</script>

<template>
  <button
    type="button"
    class="grid size-10 place-items-center rounded-full text-brand-ink transition-colors hover:bg-white/15 focus-visible:outline-white"
    :aria-label="`Theme: ${labels[current]}. Switch to ${labels[next[current]]}.`"
    :title="`Theme: ${labels[current]}`"
    @click="cycle"
  >
    <component :is="icons[current]" aria-hidden="true" class="size-5" />
  </button>
</template>
