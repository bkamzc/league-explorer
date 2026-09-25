import { afterAll, afterEach, beforeAll } from 'vitest'
import { requestLog, server } from './server'

// jsdom has no matchMedia. Behave like a 1280 px desktop browser with no motion preference,
// so the page renders the split view rather than the mobile sheet.
const VIEWPORT_WIDTH = 1280
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => {
    const minWidth = /min-width:\s*(\d+)px/.exec(query)
    return {
      matches: minWidth ? Number(minWidth[1]) <= VIEWPORT_WIDTH : false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }
  },
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  requestLog.length = 0
  localStorage.clear()
})
afterAll(() => server.close())
