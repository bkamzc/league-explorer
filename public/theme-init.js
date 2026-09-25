// Applies the saved or system theme before the app boots so there is no light/dark flash.
// Mirrors the storage key used by useColorMode in src/app/ThemeToggle.vue.
;(function () {
  try {
    var saved = localStorage.getItem('league-explorer:theme')
    var dark =
      saved === 'dark' ||
      (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  } catch {
    // Storage can be blocked (private mode); the CSS media-query fallback still applies.
  }
})()
