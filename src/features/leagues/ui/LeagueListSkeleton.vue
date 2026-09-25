<script setup lang="ts">
const { rows = 8 } = defineProps<{ rows?: number }>()

// Varied widths so the placeholder reads as a list of names, not a barcode.
const widths = ['62%', '48%', '71%', '55%', '66%', '44%', '58%', '69%']
</script>

<template>
  <div aria-hidden="true">
    <div class="border-b border-line bg-surface-2 px-4 py-2.5">
      <div class="skeleton h-3 w-24 rounded" />
    </div>
    <div
      v-for="index in rows"
      :key="index"
      class="grid min-h-14 grid-cols-[32px_minmax(0,1fr)] items-center gap-3 border-b border-line py-2 pr-3 pl-4"
    >
      <div class="skeleton size-8 rounded-full" />
      <div class="grid gap-1.5">
        <div
          class="skeleton h-3.5 rounded"
          :style="{ width: widths[(index - 1) % widths.length] }"
        />
        <div v-if="index % 3 === 1" class="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  </div>
</template>
