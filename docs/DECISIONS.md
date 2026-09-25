# Design decisions

The main choices, the alternatives I considered, and what I'd do next. Research sources are listed at the end.

## 1. Platform

- **Vue 3.5 (stable), not the 3.6 release candidate.** 3.6's headline feature, Vapor Mode, is still RC, and Vue Test Utils and DevTools don't support it yet. For a ten-component app it would buy nothing measurable. I'd pilot it on one isolated, performance-critical view (a live-odds list, say) once 3.6 is stable.
- **Plain Vite SPA, not Nuxt.** The brief asks for an SPA, so Nuxt's server layer and auto-imports would go unused. Wiring things explicitly in `main.ts`, the router and the stores is easier for a reviewer to follow. I'd pick Nuxt if SEO or server rendering mattered.
- **TypeScript 6, not 7.** `vue-tsc` still needs the TS 6 compiler API. That's also why `create-vue` pins `~6.0`.

## 2. Architecture

- **Organised by feature ("FSD-lite").** The layers are `app → pages → features/leagues → shared`, and imports only point downward; ESLint's `no-restricted-imports` enforces it. The full Feature-Sliced Design has six layers, which is overkill for one feature, so I kept its import rule and dropped the extra layers.
- **Inside the feature:**
  - `api/` is the only code that knows TheSportsDB's URLs and field names (`strLeague`, …).
  - `model/` holds the domain types, pure business rules, queries and composables.
  - `ui/` holds presentational components.
- **One container.** `LeaguesPage.vue` connects queries and state to presentational components. `LeagueDetail.vue` is a small leaf container: it fetches its own seasons through the shared cache, so the list never knows about badge fetching.
- **The DTO → domain boundary.** API field names are mapped to `League { id, name, sport, alternateNames, searchKey }` when the data arrives. Changing API version later means changing one mapper.

## 3. State, split three ways

| State | Where it lives | Why |
|---|---|---|
| Server data (leagues, seasons) | Pinia Colada query cache | Deduplication, status tracking and caching come built in |
| User preferences (data source, badge backdrop) | Pinia store, persisted to `localStorage` | Shared across components; values read back from storage are validated |
| View state (`q`, `sport`, `league`) | The URL, via `useRouteQuery` | Shareable links, survives reload, Back/Forward work |

Server data is never copied into a Pinia store, so there's only one source of truth for it.

## 4. Caching (the brief: "responses should be cached to avoid repeat calls")

Pinia Colada queries use the keys `['leagues', source]` and `['season-badges', id]`, configured in `model/leagues.queries.ts`:

- **`staleTime: Infinity` and `gcTime: false`.** One successful request per key for the whole session. Colada's defaults are a 5 s `staleTime` and a 5 min `gcTime`, and would refetch.
- **`refetchOnMount` stays on.** Colada only refreshes entries that are stale *or failed*. So a cached success is never requested again, while a failed league retries when you reopen it: errors aren't cached.
- **No refetch on window focus or reconnect.** The free API allows 30 requests a minute.
- **Concurrent callers share one in-flight request.**

`all_leagues.php` also sends `Cache-Control: max-age=14400`, so the browser's HTTP cache covers reloads. `search_all_seasons.php` sends no cache headers, so the app-level cache is what prevents repeat calls there.

A test in `LeaguesPage.spec.ts` opens league A, then B, then A again, and asserts exactly one seasons request for A. I checked that the test fails when `staleTime` is set to 0.

**Alternatives considered:**
- A hand-rolled cache: about 40 lines (TTL, in-flight dedupe, caller-scoped abort). It shows the mechanism and costs 0 KB, but Colada is the current Vue-ecosystem answer and has DevTools support.
- A Pinia store used as the cache: this mixes server data with UI state, a Vuex-era pattern.
- TanStack Query: about 14 KB against Colada's ~5.6 KB, and it reads like React in a Vue codebase.

**Race conditions.** Results are cached per league id, and the UI reads the entry for whichever league is selected. So a slow response for league A can't overwrite league B. A's request still finishes and fills the cache, because it has already counted against the rate limit and makes going back to A instant.

## 5. Data and the free-tier gap

- **Today's free `all_leagues.php` returns 5–10 leagues, all Soccer, with no `strLeagueAlternate`.** It returned 584 leagues in 2021, 50 in August 2024 and 10 in February 2026.
- **The fix: a data switch.** The live API is the default. A clearly labelled switch loads a verbatim copy of the 2021 response (`public/data/all_leagues.2021.json`), which goes through the same validation and mapping. Badges always come from the live API, which works for any league id.
  - I rejected fetching `lookupleague.php` for each league: it costs one request per league on every load, against a 30 requests/minute limit.
- **Validation.** Zod mini (about 4 KB) validates each response envelope strictly and each league on its own, so one malformed record doesn't sink the list. `seasons` comes back in three shapes, all with HTTP 200: an array; `null` (an empty state); or the string `"Invalid League ID passed"` (an error).
- **Cleaning.** The mapper:
  - collapses whitespace (some names contain `\r\n`);
  - splits alternate names on commas and drops blanks, duplicates and aliases identical to the name;
  - merges spelling variants (`ESports`/`Esports`, `Motorsport`/`Motorsports`).

  TheSportsDB's internal buckets (`_No League`) sort last. Right-to-left names render with `dir="auto"`.
- **Which season to show.** The free tier returns the five *oldest* seasons, so the app shows the latest one that has artwork and offers the others as chips. Chip labels keep the full start year ("1892–93"), because some leagues start in the 1890s.

## 6. UX

- **A dense list grouped by sport, not a card grid.** Every sportsbook uses dense rows for long league lists, and the list data has no images to fill cards. Group headers stay pinned below the sticky filter bar.
- **The detail view depends on screen width:**
  - ≥ 1024 px: a split view with a sticky panel, so you can browse and compare without closing anything.
  - Smaller screens: a bottom sheet (Reka UI Drawer) with a focus trap, Esc, outside click, swipe-down to close and focus returned to the row.
  - History: on phones, opening a league *pushes* a history entry, so Back closes the sheet. In the split view it *replaces*, so browsing doesn't fill the history.
- **Search:**
  - Every word must match, in any order, ignoring case and accents.
  - Ranking: exact name, then prefix, then word prefix, then substring, then alternate-name-only matches.
  - The input updates instantly; filtering and URL writes settle 150 ms later. Screen readers hear the result count 500 ms after it settles, not every intermediate count.
- **Sport filter.** A native `<select>`: the phone's own picker is the most usable dropdown on low-end Android. Where supported (Chrome 135+, Safari 27) it gets a styled picker via `appearance: base-select`. Quick chips mirror it for the six biggest sports, and are hidden when there are two or fewer.
- **Badge backdrop toggle.** Some badges have white lettering and others dark, so the badge sits on a neutral plate with a light/dark switch.
- **Visual language.** Taken from SportyBet: a red `#E41827` app bar, flat surfaces, 4 px corners and green for selection. SportyBet's own muted grey (2.62:1) and odds green (3.82:1 with white text) fail WCAG contrast, so the app uses `#5F6472` (5.91:1) and `#0B7F2E` (5.14:1) instead. Dark mode reuses SportyBet mobile's neutrals.

## 7. Motion

- **Built-ins and CSS only, no animation library.** Vue's `<Transition>`/`<TransitionGroup>`, CSS motion tokens (Material 3 easing), `@starting-style` and CSS animations driven by Reka's `data-state`.
- **Measured before building.** With the recipe from the Vue docs, `<TransitionGroup>` blocked the main thread for about 3.4 s when 900 rows left at once (one forced layout per leaving row). So:
  - the list renders at most 60 rows at a time, growing as you scroll;
  - row animation turns off (`:css="false"`) when more than 24 rows change, with a single opacity cue instead.
- **Reduced motion.** Removes movement and the first-load row reveal. Short fades stay.
- **Libraries considered:** motion-v (about 24 KB, fine for a future shared-element morph), `@vueuse/motion` (no release in 18 months), AutoAnimate (per-row observers are too costly for large lists), GSAP (overkill).

## 8. Performance

- **Initial JS: 86 KB gzipped.** Vue ≈ 40 KB, Router ≈ 9 KB, Zod ≈ 5 KB, VueUse ≈ 5 KB, Colada + Pinia ≈ 4 KB, plus the app. CSS is 7.7 KB.
- **The mobile sheet (Reka UI) is a separate 17 KB chunk.** It is loaded only below 1024 px, right after first render, so it's ready before the first tap.
- **Badges.** Loaded at `/small` (256 px, about 58% smaller than the original) with fixed dimensions to avoid layout shift, `fetchpriority="high"`, and a blurred `/tiny` placeholder. If an image fails, the app tries the original, then shows a placeholder. The image host sends no CORS headers, so there's no `crossorigin` attribute.
- **Search.** Each league's search key is precomputed once. API arrays are frozen, and the cache holds them without deep reactivity.
- **No virtualisation.** Filtering 3,000 leagues takes under 0.5 ms; rendering is the real cost, and the 60-row window handles it.
- **Fonts.** A system/Roboto stack: Roboto is Android's system font, so most users in SportyBet's markets download nothing.

## 9. Security

- **No `v-html` anywhere.** An ESLint rule enforces it. API text renders as escaped text; search highlights are `<mark>` elements, not HTML strings.
- **Badge URLs** must be `https:` on `r2.thesportsdb.com` or `www.thesportsdb.com`; anything else becomes "no badge".
- **`?league=`** is user input, so only numeric ids reach the API.
- **Content-Security-Policy.** Injected as a `<meta>` tag into production builds only (the dev server needs inline styles for hot reload). GitHub Pages can't set response headers, so a meta tag is the portable choice.
  - Policy: `script-src 'self'`, `style-src 'self'`, and `img-src` / `connect-src` limited to TheSportsDB.
  - The e2e tests run against this build and fail on any console error.
  - The theme is applied before first paint by an external script, and VueUse's style-injecting transition helper is replaced with a class, so no `'unsafe-inline'` is needed.
- **`VITE_*` values ship to the browser.** Key `3` is public configuration, not a secret; a paid key would need a server-side proxy.
- **Supply chain.** A committed lockfile and `npm ci`. GitHub Actions are pinned to commit SHAs. Dependabot has a 7-day cooldown before adopting new releases. Dependencies are kept minimal.

## 10. Accessibility (WCAG 2.2 AA)

- **Structure:** a skip link; `header`, `main` and `search` landmarks; one h1; an h2 per sport group and for the detail panel.
- **Controls:**
  - A labelled search input, and a native select with a visible label.
  - Rows are real `<button>`s with `aria-current`.
  - Chips and toggles use `aria-pressed` and show state with more than colour.
- **Announcements:** a `role="status"` region for result counts; `role="alert"` for errors.
- **Visuals:** focus rings of at least 3:1; `scroll-padding` so the sticky bar never hides the focused row; touch targets of 40–56 px.
- **Automated check:** axe finds zero WCAG 2.2 A/AA violations in the light and dark themes, on desktop and mobile (e2e). It found one while this was built: a contrast failure measured mid-fade. That led to switching off the first-load reveal under reduced motion.

## 11. Testing

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Text folding and highlighting; mappers and schemas against **real captured responses** (RTL/CJK aliases, `\r\n` names, null seasons, invalid id); filtering and ranking; season helpers; HTTP retry and error mapping |
| Integration | Vue Test Utils + MSW | The page with a real router, Pinia and Colada: search and URL sync, filters restored from the URL, empty state, error and retry, the no-badge state, and "a repeat open makes no request" |
| E2E | Playwright (production build) | Desktop split view; mobile sheet (focus return, Back closes it); sample data with the sport filter; no console or CSP errors; axe in both themes |

TheSportsDB is stubbed in every test, so runs are deterministic and never hit the rate limit.

## 12. The PDF's hidden text

The assignment PDF's text layer contains a stray `strDescriptionEN` right after "avoid repeat calls". It isn't visible in the rendered page. `all_leagues.php` has never returned that field; it comes from `lookupleague.php`. I treated it as a leftover, not a requirement. See next steps.

## 13. Not done, and what I'd do next

- **"About this league":** a lazily loaded, cached `lookupleague.php` call for `strDescriptionEN` and the country. Rendered as plain text with `white-space: pre-line`, never `v-html`.
- **Prefetch on intent:** fetch a league's seasons after about 100 ms of hover, or on focus. Skip it when Save-Data is on.
- **Monitoring:** error reporting through `app.config.errorHandler`, and real-user Core Web Vitals.
- **Localisation,** including a display map such as "Soccer" → "Football" (SportyBet's own term).
- **Persisting the query cache** across reloads with Colada's persister plugin, if analytics showed repeat visits.
- **A View Transition morph** from the row to the detail panel.

## Sources

- **Vue:** [Vue releases](https://github.com/vuejs/core/releases), [Vapor roadmap](https://github.com/vuejs/core/issues/13687), [performance guide](https://vuejs.org/guide/best-practices/performance.html), [security guide](https://vuejs.org/guide/best-practices/security.html), [TransitionGroup source](https://github.com/vuejs/core/blob/v3.5.43/packages/runtime-dom/src/components/TransitionGroup.ts)
- **Libraries:** [Pinia Colada queries](https://pinia-colada.esm.dev/guide/queries.html), [Vue Router 4 → 5](https://router.vuejs.org/guide/migration/v4-to-v5.html), [Zod mini](https://zod.dev/packages/mini)
- **Data:** [TheSportsDB documentation](https://www.thesportsdb.com/documentation)
- **Accessibility:** [WAI-ARIA APG: modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
