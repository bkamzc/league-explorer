# AI usage

The brief allows AI tools and asks for a note on how they were used. Here it is.

## Tools

- **Claude Code** (Anthropic, model Claude Opus 5.5) in the terminal, for research, planning, implementation, tests and documentation.
- **Claude in Chrome** (browser automation), which the research agents used to inspect live sites and APIs, and later to check the running app visually.
- The commits made with AI assistance carry a `Co-Authored-By: Claude` trailer.

## How they were used

1. **Research first, code second.** Before any code, I had Claude Code run six research agents in parallel:
   - Vue 3.5/3.6 features and architecture;
   - TheSportsDB API behaviour;
   - caching, performance and security;
   - UI/UX, covering SportyBet and ten competitor products;
   - motion;
   - 2026 Vue tooling.

   They checked versions against npm and GitHub, measured the real API, and extracted SportyBet's colours and patterns. The findings were combined into one brief with nine decisions (data source, caching layer, URL state, detail pattern, styling, motion, visual direction, the hidden `strDescriptionEN` text, scope). I reviewed and approved it before building started.
2. **What the research changed.** It found that the free API now returns 5–10 Soccer leagues with no alternate names. That produced the live/sample data switch. The motion agent measured that `<TransitionGroup>` blocks the main thread for seconds on large lists, which produced the adaptive list animation.
3. **Implementation.** Claude Code scaffolded with `create-vue`, then wrote the data layer, UI, tests, CI and these docs, in reviewable commits. It checked its own work along the way:
   - type-check, lint, unit/integration and e2e tests, and axe;
   - screenshots of the running app on desktop and phone;
   - a deliberately broken cache setting, to prove the cache test fails when caching is off.
4. **Problems found and fixed along the way:**
   - Chip labels like "92–93" were ambiguous for leagues whose seasons start in the 1890s.
   - TheSportsDB's `_No League` placeholders sorted to the top of the list.
   - A contrast failure measured during an animation.
   - An accessibility-lint rule that was stricter than WCAG.
   - The bundle size, which moved the mobile sheet into its own chunk.

## Checks run before submission

- A fresh clone installs and runs with `npm ci && npm run dev`, and `npm run check` (format, lint, type-check, tests, build) and `npm run test:e2e` pass.
- The TheSportsDB behaviour described in the README was confirmed against the live API on 25 Sep 2026.

## Time

The research, review and build together took well beyond the suggested 90 minutes. The research and the tests/accessibility work account for most of the extra time. The 90-minute core is the data layer, the list with search and dropdown, the cached badge lookup and the basic states. I chose to go further because this is a submission for a team lead role, where judgement, testing and documentation are part of what's being assessed.
