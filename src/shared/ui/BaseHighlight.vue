<script setup lang="ts">
import { computed } from 'vue'
import { highlightSegments } from '@/shared/lib/text'

const { text, tokens } = defineProps<{
  text: string
  /** Folded search words to highlight. */
  tokens: readonly string[]
}>()

// Rendered as text nodes and <mark> elements, never v-html: API text is untrusted.
const segments = computed(() => highlightSegments(text, tokens))
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <mark v-if="segment.match">{{ segment.text }}</mark>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
