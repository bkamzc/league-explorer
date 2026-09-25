import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

// Real TheSportsDB responses (captured 2026-09-25), shared with the unit tests.
const fixtures = JSON.parse(
  readFileSync(new URL('../src/test/fixtures/sportsdb.json', import.meta.url), 'utf8'),
)
const badgePng = readFileSync(new URL('./fixtures/badge.png', import.meta.url))

const cors = { 'access-control-allow-origin': '*' }

/** Stubs TheSportsDB so runs are deterministic and never hit the 30 requests/minute limit. */
async function stubSportsDb(page: Page) {
  const seasonRequests: string[] = []
  await page.route('**/api/v1/json/*/all_leagues.php', (route) =>
    route.fulfill({ json: fixtures.allLeagues.free, headers: cors }),
  )
  await page.route('**/api/v1/json/*/search_all_seasons.php*', (route) => {
    const id = new URL(route.request().url()).searchParams.get('id') ?? ''
    seasonRequests.push(id)
    const body =
      id === '4328'
        ? fixtures.seasonBadges['4328_allBadges']
        : id === '4329'
          ? fixtures.seasonBadges['4329_allNullBadges']
          : { seasons: null }
    return route.fulfill({ json: body, headers: cors })
  })
  await page.route('https://r2.thesportsdb.com/**', (route) =>
    route.fulfill({ body: badgePng, contentType: 'image/png' }),
  )
  return { seasonRequests }
}

/** Fails the test on any console error, including Content-Security-Policy violations. */
function trackConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const leagueRow = (page: Page, name: string) =>
  page.locator('[data-league-id]').filter({ hasText: name })

const eplBadge = (page: Page) =>
  page.getByRole('img', { name: 'English Premier League badge, 1996–1997 season' })

test(
  'desktop: search, open leagues in the split view, repeat opens use the cache',
  { tag: '@desktop' },
  async ({ page }) => {
    const errors = trackConsoleErrors(page)
    const { seasonRequests } = await stubSportsDb(page)
    await page.goto('/')

    await expect(page.locator('[data-league-id]')).toHaveCount(5)
    await page.getByRole('searchbox', { name: 'Search leagues' }).fill('prem')
    await expect(page.locator('[data-league-id]')).toHaveCount(2)
    await expect(page).toHaveURL(/q=prem/)

    await leagueRow(page, 'English Premier League').click()
    await expect(eplBadge(page)).toBeVisible()
    await leagueRow(page, 'Scottish Premier League').click()
    await expect(page.getByText('TheSportsDB doesn’t list any seasons')).toBeVisible()
    await leagueRow(page, 'English Premier League').click()
    await expect(eplBadge(page)).toBeVisible()

    expect(seasonRequests.filter((id) => id === '4328')).toHaveLength(1)
    expect(errors).toEqual([])
  },
)

test(
  'mobile: the bottom sheet opens, closes back to its row, and reuses the cache',
  { tag: '@mobile' },
  async ({ page }) => {
    const errors = trackConsoleErrors(page)
    const { seasonRequests } = await stubSportsDb(page)
    await page.goto('/')

    await leagueRow(page, 'English Premier League').click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('img', { name: /English Premier League badge/ })).toBeVisible()

    await sheet.getByRole('button', { name: 'Close' }).first().click()
    await expect(sheet).toBeHidden()
    await expect(leagueRow(page, 'English Premier League')).toBeFocused()
    await expect(page).not.toHaveURL(/league=/)

    await leagueRow(page, 'English Premier League').click()
    await expect(eplBadge(page)).toBeVisible()
    // The phone's Back button closes the sheet.
    await page.goBack()
    await expect(sheet).toBeHidden()

    expect(seasonRequests.filter((id) => id === '4328')).toHaveLength(1)
    expect(errors).toEqual([])
  },
)

test('switch to the 2021 sample and filter by sport', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await stubSportsDb(page)
  await page.goto('/')

  await page.getByRole('button', { name: '2021 sample' }).click()
  await expect(page.getByRole('group', { name: 'Popular sports' })).toBeVisible()
  await page.getByLabel('Sport', { exact: true }).selectOption('Basketball')

  await expect(page).toHaveURL(/sport=Basketball/)
  await expect(leagueRow(page, 'NBA').first()).toBeVisible()
  await expect(page.locator('[data-league-id]')).toHaveCount(37)
  expect(errors).toEqual([])
})

test('a league without artwork explains why', async ({ page }) => {
  await stubSportsDb(page)
  await page.goto('/?league=4329')
  await expect(page.getByText('No season badges yet for English League Championship')).toBeVisible()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no detectable WCAG 2.2 A/AA violations (${colorScheme})`, async ({ page }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright')
    // Reduced motion: no entrance animations, so contrast is measured on final colours.
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await stubSportsDb(page)
    await page.goto('/?league=4328')
    await expect(page.getByText('Season 1996–1997')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map(({ id, nodes }) => `${id} (${nodes.length})`)).toEqual([])
  })
}
