<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'
import IconChevronDown from '~icons/mdi/chevron-down'
import type { SelectOption } from './types'

const {
  label,
  options,
  disabled = false,
} = defineProps<{
  label: string
  options: readonly SelectOption<T>[]
  disabled?: boolean
}>()

const model = defineModel<T>({ required: true })

const selectId = useId()
</script>

<template>
  <div class="flex items-center gap-2">
    <label :for="selectId" class="shrink-0 text-xs font-medium text-muted">{{ label }}</label>
    <div class="relative min-w-0 flex-1">
      <!-- Native select: the phone's own picker is the best dropdown on low-end Android. -->
      <select
        :id="selectId"
        v-model="model"
        :disabled
        class="select h-12 w-full appearance-none truncate rounded border border-line-strong bg-surface pl-3 pr-10 text-base text-ink-strong transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <IconChevronDown
        aria-hidden="true"
        class="chevron pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted"
      />
    </div>
  </div>
</template>

<style scoped>
/* Customizable select (Chrome 135+, Safari 27): same native semantics, styled picker. */
@supports (appearance: base-select) {
  .select,
  .select::picker(select) {
    appearance: base-select;
  }
  .select {
    display: flex;
    align-items: center;
  }
  .select::picker-icon {
    display: none;
  }
  .select::picker(select) {
    margin-top: 4px;
    padding: 4px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink-strong);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
    max-height: min(60vh, 420px);
    opacity: 0;
    transform: scale(var(--motion-scale-pop));
    transform-origin: top center;
    transition:
      opacity var(--motion-duration-sm) var(--motion-ease-enter),
      transform var(--motion-duration-sm) var(--motion-ease-enter),
      overlay var(--motion-duration-sm) allow-discrete,
      display var(--motion-duration-sm) allow-discrete;
  }
  .select:open::picker(select) {
    opacity: 1;
    transform: none;
  }
  @starting-style {
    .select:open::picker(select) {
      opacity: 0;
      transform: scale(var(--motion-scale-pop));
    }
  }
  .select option {
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 15px;
  }
  .select option:checked {
    font-weight: 600;
    background: var(--accent-subtle);
  }
  .select option:hover,
  .select option:focus-visible {
    background: var(--surface-2);
  }
  .select option::checkmark {
    color: var(--accent);
  }
  .select:open + .chevron {
    transform: translateY(-50%) rotate(180deg);
  }
}
.chevron {
  transition: transform var(--motion-duration-sm) var(--motion-ease-standard);
}
</style>
