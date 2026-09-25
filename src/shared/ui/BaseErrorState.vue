<script setup lang="ts">
import IconAlert from '~icons/mdi/alert-circle-outline'
import IconRefresh from '~icons/mdi/refresh'

const {
  title,
  message,
  retrying = false,
  compact = false,
} = defineProps<{
  title: string
  message: string
  retrying?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="grid justify-items-center gap-3 text-center"
    :class="compact ? 'px-3 py-6' : 'px-5 py-10'"
  >
    <IconAlert aria-hidden="true" class="size-9 text-danger" />
    <p class="text-base font-bold text-ink-strong">{{ title }}</p>
    <p class="max-w-[44ch] text-sm text-muted">{{ message }}</p>
    <button
      type="button"
      class="inline-flex h-10 items-center gap-2 rounded bg-accent px-4 text-sm font-semibold text-accent-ink transition-[filter,transform] duration-100 hover:brightness-110 active:scale-(--motion-scale-press) disabled:opacity-60"
      :disabled="retrying"
      @click="emit('retry')"
    >
      <IconRefresh aria-hidden="true" class="size-4" :class="{ 'animate-spin': retrying }" />
      {{ retrying ? 'Retrying…' : 'Try again' }}
    </button>
  </div>
</template>
