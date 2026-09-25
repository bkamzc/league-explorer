<script setup lang="ts">
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only z-50 rounded bg-surface px-4 py-2 font-semibold text-ink-strong shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Skip to leagues
    </a>
    <AppHeader />
    <main id="main" tabindex="-1" class="flex-1 outline-none">
      <RouterView />
    </main>
    <footer class="border-t border-line py-5 text-center text-xs text-muted">
      League data and badges:
      <a
        href="https://www.thesportsdb.com"
        target="_blank"
        rel="noopener noreferrer"
        class="underline underline-offset-2 hover:text-ink-strong"
        >TheSportsDB</a
      >
      (free API). Built with Vue 3 for the Sporty Group frontend take-home.
    </footer>
  </div>
</template>
