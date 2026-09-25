import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { createMemoryHistory, createRouter } from 'vue-router'
import { API, countRequests, server } from '@/test/server'
import LeaguesPage from '../LeaguesPage.vue'

/** Mounts the page like the app does: fresh Pinia (and query cache), router and MSW-backed API. */
async function renderPage(path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: LeaguesPage }],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(LeaguesPage, {
    global: { plugins: [createPinia(), PiniaColada, router] },
    attachTo: document.body,
  })
  return { wrapper, router }
}

const rowNames = (wrapper: Awaited<ReturnType<typeof renderPage>>['wrapper']) =>
  wrapper.findAll('button[data-league-id]').map((row) => row.text())

describe('LeaguesPage', () => {
  it('loads leagues once and lists them by sport', async () => {
    const { wrapper } = await renderPage()
    await vi.waitFor(() => expect(rowNames(wrapper)).toHaveLength(5))

    expect(wrapper.text()).toContain('Soccer · 5')
    expect(wrapper.text()).toContain('5 leagues')
    expect(countRequests('all_leagues.php')).toBe(1)
    wrapper.unmount()
  })

  it('filters by search, highlights matches and writes the query to the URL', async () => {
    const { wrapper, router } = await renderPage()
    await vi.waitFor(() => expect(rowNames(wrapper)).toHaveLength(5))

    await wrapper.find('input[type="search"]').setValue('prem')
    await vi.waitFor(() =>
      expect(rowNames(wrapper)).toEqual(['English Premier League', 'Scottish Premier League']),
    )
    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['Prem', 'Prem'])
    await vi.waitFor(() => expect(router.currentRoute.value.query.q).toBe('prem'))
    wrapper.unmount()
  })

  it('restores filters from the URL', async () => {
    const { wrapper } = await renderPage('/?q=bundes&sport=Soccer')
    await vi.waitFor(() => expect(rowNames(wrapper)).toEqual(['German Bundesliga']))
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('Soccer')
    wrapper.unmount()
  })

  it('offers a way out of an empty result', async () => {
    const { wrapper } = await renderPage()
    await vi.waitFor(() => expect(rowNames(wrapper)).toHaveLength(5))

    await wrapper.find('input[type="search"]').setValue('xyz')
    await vi.waitFor(() => expect(wrapper.text()).toContain('No leagues found'))

    const clear = wrapper.findAll('button').find((button) => button.text() === 'Clear search')
    await clear!.trigger('click')
    await vi.waitFor(() => expect(rowNames(wrapper)).toHaveLength(5))
    wrapper.unmount()
  })

  it('shows the latest season badge and serves repeat opens from the cache', async () => {
    const { wrapper, router } = await renderPage()
    await vi.waitFor(() => expect(rowNames(wrapper)).toHaveLength(5))

    const open = async (id: string) => {
      await wrapper.find(`[data-league-id="${id}"]`).trigger('click')
      await vi.waitFor(() => expect(router.currentRoute.value.query.league).toBe(id))
    }

    await open('4328')
    await vi.waitFor(() =>
      expect(
        wrapper.find('img[alt="English Premier League badge, 1996–1997 season"]').exists(),
      ).toBe(true),
    )
    await open('4330')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Scottish Premier League'))
    await open('4328')
    await vi.waitFor(() =>
      expect(
        wrapper.find('img[alt="English Premier League badge, 1996–1997 season"]').exists(),
      ).toBe(true),
    )

    // The brief: responses are cached to avoid repeat calls.
    expect(countRequests('search_all_seasons.php?badge=1&id=4328')).toBe(1)
    expect(countRequests('all_leagues.php')).toBe(1)
    wrapper.unmount()
  })

  it('explains when a league has no season badges', async () => {
    const { wrapper } = await renderPage('/?league=4329')
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('No season badges yet for English League Championship'),
    )
    wrapper.unmount()
  })

  it('shows an error with a retry that makes a fresh request', async () => {
    server.use(http.get(`${API}/all_leagues.php`, () => HttpResponse.error(), { once: true }))
    const { wrapper } = await renderPage()

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain('TheSportsDB is busy'),
    )
    const retry = wrapper.findAll('button').find((button) => button.text().includes('Try again'))
    await retry!.trigger('click')

    await vi.waitFor(() => expect(rowNames(wrapper)).toHaveLength(5))
    expect(countRequests('all_leagues.php')).toBe(2)
    wrapper.unmount()
  })
})
