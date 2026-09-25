<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconImageOff from '~icons/mdi/image-off-outline'
import type { BadgeBackdrop } from '../model/league'
import { badgeVariantUrl } from '../model/seasons'

const { url, alt, backdrop } = defineProps<{
  /** Validated badge URL (original size). */
  url: string
  alt: string
  backdrop: BadgeBackdrop
}>()

/** Try the 256 px variant first, then the original, then give up gracefully. */
const variant = ref<'small' | 'original' | 'failed'>('small')
const loaded = ref(false)
const placeholderFailed = ref(false)

watch(
  () => url,
  () => {
    variant.value = 'small'
    loaded.value = false
    placeholderFailed.value = false
  },
)

const src = computed(() =>
  badgeVariantUrl(url, variant.value === 'original' ? 'original' : 'small'),
)
const placeholder = computed(() => badgeVariantUrl(url, 'tiny'))

function onError() {
  loaded.value = false
  variant.value = variant.value === 'small' ? 'original' : 'failed'
}
</script>

<template>
  <div
    class="stage relative mx-auto grid aspect-square w-full max-w-[220px] place-items-center overflow-hidden rounded-xl"
    :class="backdrop"
  >
    <template v-if="variant !== 'failed'">
      <!-- Blur-up: the 128 px image (often already cached from the season chips) shows first. -->
      <img
        v-if="!loaded && !placeholderFailed"
        :src="placeholder"
        alt=""
        aria-hidden="true"
        width="128"
        height="128"
        class="absolute size-[60%] scale-105 object-contain opacity-70 blur-md"
        @error="placeholderFailed = true"
      />
      <!-- No crossorigin attribute: TheSportsDB's image host sends no CORS headers. -->
      <img
        :key="src"
        :src
        :alt
        width="256"
        height="256"
        decoding="async"
        fetchpriority="high"
        class="badge relative size-[60%] object-contain"
        :class="{ loaded }"
        @load="loaded = true"
        @error="onError"
      />
    </template>
    <div
      v-else
      class="grid justify-items-center gap-2 px-4 text-center text-sm text-muted"
      role="img"
      :aria-label="alt"
    >
      <IconImageOff aria-hidden="true" class="size-10" />
      <span aria-hidden="true">Badge image unavailable</span>
    </div>
  </div>
</template>

<style scoped>
.stage.light {
  background: var(--plate-light);
}
.stage.dark {
  background: var(--plate-dark);
}
.badge {
  opacity: 0;
  transform: scale(var(--motion-scale-pop));
  transition:
    opacity var(--motion-duration-md) var(--motion-ease-standard),
    transform var(--motion-duration-md) var(--motion-ease-standard);
}
.badge.loaded {
  opacity: 1;
  transform: none;
}
</style>
