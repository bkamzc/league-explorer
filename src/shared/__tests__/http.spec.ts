import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/server'
import {
  HttpError,
  NetworkError,
  ResponseFormatError,
  classifyError,
  describeError,
} from '../api/errors'
import { getJson } from '../api/http'

const ENDPOINT = 'https://example.test/data.json'

describe('getJson', () => {
  it('returns parsed JSON', async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ ok: true })))
    await expect(getJson(ENDPOINT)).resolves.toEqual({ ok: true })
  })

  it('retries 5xx responses, then gives up with an HttpError', async () => {
    let calls = 0
    server.use(
      http.get(ENDPOINT, () => {
        calls++
        return new HttpResponse('down', { status: 503 })
      }),
    )
    await expect(getJson(ENDPOINT, { retries: 1 })).rejects.toBeInstanceOf(HttpError)
    expect(calls).toBe(2)
  })

  it('does not retry network errors, which is how a CORS-less 429 appears', async () => {
    let calls = 0
    server.use(
      http.get(ENDPOINT, () => {
        calls++
        return HttpResponse.error()
      }),
    )
    await expect(getJson(ENDPOINT)).rejects.toBeInstanceOf(NetworkError)
    expect(calls).toBe(1)
  })

  it('reports a non-JSON body as a format error', async () => {
    server.use(http.get(ENDPOINT, () => new HttpResponse('<html>', { status: 200 })))
    await expect(getJson(ENDPOINT)).rejects.toBeInstanceOf(ResponseFormatError)
  })
})

describe('describeError', () => {
  it('maps errors to user-facing copy', () => {
    expect(classifyError(new NetworkError('x'), false)).toBe('offline')
    expect(classifyError(new HttpError(429, ENDPOINT), true)).toBe('busy')
    expect(classifyError(new HttpError(400, ENDPOINT), true)).toBe('config')
    expect(describeError(new NetworkError('x'), 'TheSportsDB', true).title).toBe(
      'TheSportsDB is busy',
    )
  })
})
