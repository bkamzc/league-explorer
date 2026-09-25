import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import fixtures from './fixtures/sportsdb.json'

export { fixtures }

export const API = 'https://www.thesportsdb.com/api/v1/json/3'

const seasonsById: Record<string, unknown> = {
  '4328': fixtures.seasonBadges['4328_allBadges'],
  '4329': fixtures.seasonBadges['4329_allNullBadges'],
  '4424': fixtures.seasonBadges['4424_mixedNullFirst'],
}

/** Default handlers: the real responses TheSportsDB returned on 2026-09-25. */
export const handlers = [
  http.get(`${API}/all_leagues.php`, () => HttpResponse.json(fixtures.allLeagues.free)),
  http.get(`${API}/search_all_seasons.php`, ({ request }) => {
    const id = new URL(request.url).searchParams.get('id') ?? ''
    return HttpResponse.json(seasonsById[id] ?? { seasons: null })
  }),
]

export const server = setupServer(...handlers)

/** Every request URL the app made during the current test. */
export const requestLog: string[] = []
server.events.on('request:start', ({ request }) => {
  requestLog.push(request.url)
})

export const countRequests = (fragment: string) =>
  requestLog.filter((url) => url.includes(fragment)).length
