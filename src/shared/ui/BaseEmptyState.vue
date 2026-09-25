<script setup lang="ts">
const { title, description } = defineProps<{
  title: string
  description?: string
}>()

defineSlots<{
  icon?(): unknown
  actions?(): unknown
}>()
</script>

<template>
  <div class="grid justify-items-center gap-3 px-5 py-10 text-center">
    <div v-if="$slots.icon" class="text-line-strong [&>svg]:size-10">
      <slot name="icon" />
    </div>
    <p class="text-base font-bold text-ink-strong">{{ title }}</p>
    <p v-if="description" class="max-w-[42ch] text-sm text-muted">{{ description }}</p>
    <div v-if="$slots.actions" class="flex flex-wrap justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
