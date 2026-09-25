<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import IconMagnify from '~icons/mdi/magnify'
import IconClose from '~icons/mdi/close'

defineOptions({ inheritAttrs: false })

const {
  label,
  placeholder = 'Search…',
  hint,
  shortcut,
} = defineProps<{
  label: string
  placeholder?: string
  /** Screen-reader description of what the search matches. */
  hint?: string
  /** A single key that focuses the field from anywhere on the page, e.g. "/". */
  shortcut?: string
}>()

const emit = defineEmits<{ clear: [] }>()

const model = defineModel<string>({ required: true })

const inputId = useId()
const hintId = useId()
const input = useTemplateRef<HTMLInputElement>('input')

function clear() {
  model.value = ''
  emit('clear')
  input.value?.focus()
}

function onEscape(event: KeyboardEvent) {
  if (!model.value) return input.value?.blur()
  event.preventDefault()
  clear()
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

if (shortcut) {
  onKeyStroke(shortcut, (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
    event.preventDefault()
    input.value?.focus()
  })
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div
    class="flex h-12 items-center gap-2 rounded border border-line-strong bg-surface pl-3 pr-1 transition-[border-color,box-shadow] duration-150 focus-within:border-ink-strong focus-within:shadow-[0_0_0_1px_var(--ink-strong)]"
  >
    <label :for="inputId" class="sr-only">{{ label }}</label>
    <IconMagnify aria-hidden="true" class="size-5 shrink-0 text-muted" />
    <input
      :id="inputId"
      ref="input"
      v-model="model"
      v-bind="$attrs"
      type="search"
      :placeholder
      :aria-describedby="hint ? hintId : undefined"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="search"
      class="search-input h-full min-w-0 flex-1 bg-transparent text-base text-ink-strong outline-none placeholder:text-muted"
      @keydown.esc="onEscape"
    />
    <kbd
      v-if="shortcut && !model"
      aria-hidden="true"
      class="mr-2 hidden rounded border border-line-strong px-1.5 font-mono text-xs text-muted sm:inline"
      title="Press / to search"
      >{{ shortcut }}</kbd
    >
    <Transition name="pop">
      <button
        v-if="model"
        type="button"
        aria-label="Clear search"
        class="grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink-strong"
        @click="clear"
      >
        <IconClose aria-hidden="true" class="size-5" />
      </button>
    </Transition>
    <span v-if="hint" :id="hintId" class="sr-only">{{ hint }}</span>
  </div>
</template>

<style scoped>
.search-input::-webkit-search-cancel-button {
  display: none;
}
.pop-enter-active {
  transition:
    opacity var(--motion-duration-sm) var(--motion-ease-enter),
    transform var(--motion-duration-sm) var(--motion-ease-enter);
}
.pop-leave-active {
  transition: opacity var(--motion-duration-xs) var(--motion-ease-exit);
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.pop-leave-to {
  opacity: 0;
}
</style>
