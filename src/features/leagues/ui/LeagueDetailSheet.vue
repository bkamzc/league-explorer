<script setup lang="ts">
import {
  DrawerClose,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  VisuallyHidden,
} from 'reka-ui'
import IconClose from '~icons/mdi/close'

const { title, returnFocusTo } = defineProps<{
  title: string
  /** Element to focus after closing: the row that opened the sheet. */
  returnFocusTo?: () => HTMLElement | null
}>()

const open = defineModel<boolean>('open', { required: true })

defineSlots<{ default(): unknown }>()

function restoreFocus(event: Event) {
  const target = returnFocusTo?.()
  if (!target) return
  event.preventDefault()
  target.focus({ preventScroll: false })
}
</script>

<template>
  <!-- Reka UI Drawer: focus trap, Esc, outside press, scroll lock and swipe-down to dismiss. -->
  <DrawerRoot v-model:open="open" swipe-direction="down">
    <DrawerPortal>
      <DrawerOverlay class="sheet-overlay fixed inset-0 z-40 bg-(--scrim)" />
      <DrawerContent
        class="sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl bg-surface text-ink shadow-[0_-8px_32px_rgb(0_0_0/0.28)] outline-none"
        :aria-describedby="undefined"
        @close-auto-focus="restoreFocus"
      >
        <div
          aria-hidden="true"
          class="mx-auto mt-2 mb-1 h-1 w-9 shrink-0 rounded-full bg-line-strong"
        />
        <VisuallyHidden as-child>
          <DrawerTitle>{{ title }}</DrawerTitle>
        </VisuallyHidden>
        <div class="relative z-10 flex justify-end px-3">
          <DrawerClose
            class="grid size-10 place-items-center rounded-full bg-surface-2 text-ink-strong"
            aria-label="Close"
          >
            <IconClose aria-hidden="true" class="size-5" />
          </DrawerClose>
        </div>
        <!-- Pulls the heading up beside the close button; the padding keeps them from overlapping. -->
        <div class="-mt-9 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 [&_h2]:pr-12">
          <slot />
        </div>
        <div
          class="shrink-0 border-t border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <DrawerClose
            class="h-12 w-full rounded bg-surface-2 text-sm font-semibold text-ink-strong hover:bg-line"
          >
            Close
          </DrawerClose>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
.sheet {
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
}
.sheet[data-state='open'] {
  animation: sheet-in var(--motion-duration-lg) var(--motion-ease-emphasized-enter);
}
.sheet[data-state='closed'] {
  animation: sheet-out var(--motion-duration-md) var(--motion-ease-exit) forwards;
}
.sheet[data-swiping] {
  animation: none;
}
.sheet-overlay[data-state='open'] {
  animation: fade-in var(--motion-duration-md) var(--motion-ease-standard);
}
.sheet-overlay[data-state='closed'] {
  animation: fade-out var(--motion-duration-md) var(--motion-ease-exit) forwards;
}
@keyframes sheet-in {
  from {
    transform: translateY(100%);
  }
}
@keyframes sheet-out {
  to {
    transform: translateY(100%);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
}
@keyframes fade-out {
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sheet[data-state='open'],
  .sheet[data-state='closed'] {
    animation-name: fade-in;
    animation-duration: var(--motion-duration-sm);
  }
  .sheet[data-state='closed'] {
    animation-name: fade-out;
  }
}
</style>
