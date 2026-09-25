# League Explorer

A Vue 3 single-page app for the Sporty Group frontend take-home. It lists sports leagues from [TheSportsDB](https://www.thesportsdb.com), filters them by name and sport, and shows a season badge when you open a league. Every API response is cached for the session.

**Live demo:** _added after the first GitHub Pages deploy_

| | |
|---|---|
| Stack | Vue 3.5 · TypeScript 6 · Vite 8 · Vue Router 5 · Pinia 4 + Pinia Colada · VueUse · Tailwind CSS 4 · Reka UI · Zod |
| Tests | Vitest + Vue Test Utils + MSW (41 tests) · Playwright e2e on desktop and a Pixel 7 profile, with axe WCAG 2.2 AA scans (10 tests) |
| Docs | [Design decisions](docs/DECISIONS.md) · [AI usage](docs/AI_USAGE.md) |

## Run it

Requires Node 22.18+ or 24 (`.nvmrc` pins 24). No `.env` file is needed: the brief's free API key is the default.

```bash
npm ci
npm run dev        # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run build` / `npm run preview` | Type-check and build for production, then serve the build |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run test:e2e` | Playwright against the production build. Run `npm run test:e2e:install` once first. |
| `npm run check` | Everything CI runs: format check, lint, type-check, tests, build |

To use another key or API host, copy `.env.example` to `.env.local`.

## What it does

- **League list.** Fetched once and shown with `strLeague`, `strSport` and `strLeagueAlternate`, grouped by sport with counts.
- **Search.** Ignores case and accents, matches every word in any order, and checks both names and alternate names. Best matches come first and matched text is highlighted. <kbd>/</kbd> focuses the search box and <kbd>Esc</kbd> clears it.
- **Sport dropdown.** A native `<select>` built from the data, with counts. When there are more than two sports, quick chips for the most common ones mirror it.
- **Season badge.** Clicking a league calls the Season Badge API and shows the **latest season that has a badge**. The other seasons are chips, which need no extra requests. On screens 1024 px and wider this appears in a split view; below that, in a bottom sheet you can swipe down.
- **Caching.** Each response is requested once per session. Opening a league a second time makes no request; a test proves it.
- **Shareable state.** `?q=`, `?sport=` and `?league=` live in the URL, so reload, Back and shared links all work. On phones, Back closes the sheet.
- **States.** Loading skeletons; empty states with a way out ("Clear search", "Search all sports (3)"); errors with Retry; an offline notice; a designed no-badge state.
- **Theme and accessibility.** Light, dark and system themes. Keyboard and screen-reader friendly, with zero axe violations in either theme.

## TheSportsDB's free tier has changed since the brief

These were checked against the live API on 25 Sep 2026:

- `all_leagues.php` now returns **5–10 leagues, all Soccer, and no `strLeagueAlternate` field**. In 2021 it returned 584 leagues across 23 sports.
  - Used as-is, the sport dropdown would have one option. So the app has a clearly labelled **data switch: Live API or a 2021 sample** (the verbatim 2021 response, 584 leagues). Season badges always come from the live API, which works for any league id.
- `search_all_seasons.php` returns at most **five seasons, oldest first**, and sends no cache headers. Some leagues (e.g. 4329, English League Championship) have no badges at all.
- The free API allows **30 requests a minute**. A rate-limited request fails without CORS headers, so the browser only sees a network error. The app treats that as "busy" and never retries it automatically.

## Project structure

Organised by feature, with imports pointing downward only (`app → pages → features → shared`). ESLint enforces this.

```
src/
├─ app/                App shell, router, theme toggle, design tokens (styles/main.css)
├─ pages/              LeaguesPage.vue: the container that connects state to the UI
├─ features/leagues/
│  ├─ api/             TheSportsDB client: config, Zod schemas, DTO → domain mappers
│  ├─ model/           Domain types, filtering/ranking, Colada queries, URL state, preferences store
│  ├─ ui/              Presentational components (props in, events out)
│  └─ index.ts         The feature's public API
├─ shared/             Generic HTTP client and errors, text helpers, base UI components
└─ test/               MSW server, setup, real captured API fixtures
```

## Performance and security

- **Performance.** The initial JS is 86 KB gzipped; Vue itself is about 40 KB of that. The mobile bottom sheet (Reka UI) is a separate 17 KB chunk that desktop never downloads.
  - The list renders 60 rows at a time.
  - Row animations switch off when more than 24 rows change at once, because animating hundreds of leaving rows blocked the main thread for seconds when measured.
  - Badges load at 256 px, with a blurred 128 px placeholder first.
- **Security.**
  - A Content-Security-Policy in production builds.
  - No `v-html`.
  - Badge URLs must be https on TheSportsDB's hosts.
  - `?league=` only accepts numeric ids.
  - API responses are validated at runtime.
  - GitHub Actions are pinned to commit SHAs, and Dependabot waits 7 days before adopting a new release.

More detail and the reasoning behind each choice: [docs/DECISIONS.md](docs/DECISIONS.md).

## Credits

League data and badge images come from [TheSportsDB](https://www.thesportsdb.com) (free API). The design takes its cues from Sporty Group's public products: SportyBet's red app bar, dense lists and green selection, with contrast-checked colours.
