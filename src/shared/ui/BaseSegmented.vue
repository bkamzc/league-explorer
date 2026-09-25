<script setup lang="ts" generic="T extends string">
import type { SelectOption } from './types'

const { label, options } = defineProps<{
  /** Accessible name for the group. */
  label: string
  options: readonly SelectOption<T>[]
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    class="inline-flex rounded-full border border-line-strong p-0.5"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="model === option.value"
      class="h-8 rounded-full px-3 text-xs font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:bg-surface-2 aria-pressed:bg-ink-strong aria-pressed:text-surface"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
