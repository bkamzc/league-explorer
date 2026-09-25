/** The server answered with a non-2xx status. */
export class HttpError extends Error {
  override readonly name = 'HttpError'

  constructor(
    readonly status: number,
    readonly url: string,
    readonly detail?: string,
  ) {
    super(`Request failed with HTTP ${status}`)
  }
}

/**
 * `fetch` rejected before a response was readable: offline, DNS, or an error response
 * without CORS headers. TheSportsDB's Cloudflare 429 has no CORS headers, so a rate
 * limit also lands here.
 */
export class NetworkError extends Error {
  override readonly name = 'NetworkError'
}

export class TimeoutError extends Error {
  override readonly name = 'TimeoutError'
}

/** The response wasn't JSON, or didn't match the expected schema. */
export class ResponseFormatError extends Error {
  override readonly name = 'ResponseFormatError'
}

export type ErrorKind = 'offline' | 'busy' | 'timeout' | 'config' | 'server' | 'format' | 'unknown'

export function classifyError(
  error: unknown,
  isOnline = globalThis.navigator?.onLine ?? true,
): ErrorKind {
  if (!isOnline) return 'offline'
  if (error instanceof NetworkError) return 'busy'
  if (error instanceof TimeoutError) return 'timeout'
  if (error instanceof ResponseFormatError) return 'format'
  if (error instanceof HttpError) {
    if (error.status === 429) return 'busy'
    if (error.status === 400 || error.status === 401 || error.status === 403) return 'config'
    return 'server'
  }
  return 'unknown'
}

export interface ErrorDescription {
  kind: ErrorKind
  title: string
  message: string
}

/** User-facing copy: what went wrong and what to do about it. */
export function describeError(
  error: unknown,
  service: string,
  isOnline?: boolean,
): ErrorDescription {
  const kind = classifyError(error, isOnline)
  switch (kind) {
    case 'offline':
      return { kind, title: 'You’re offline', message: 'Check your connection, then try again.' }
    case 'busy':
      return {
        kind,
        title: `${service} is busy`,
        message: `${service} limits free requests to 30 a minute, or it couldn't be reached. Wait a minute, then try again.`,
      }
    case 'timeout':
      return {
        kind,
        title: `${service} is slow to respond`,
        message: 'The request timed out. Try again.',
      }
    case 'config':
      return {
        kind,
        title: `${service} rejected the request`,
        message:
          'The API key or URL is invalid. Check VITE_SPORTSDB_API_KEY and VITE_SPORTSDB_BASE_URL.',
      }
    case 'format':
      return {
        kind,
        title: 'Unexpected data',
        message: `${service} sent a response in a format this app doesn't recognise.`,
      }
    case 'server':
      return {
        kind,
        title: `${service} had a problem`,
        message: 'The server returned an error. Try again shortly.',
      }
    default:
      return { kind, title: 'Something went wrong', message: 'Try again.' }
  }
}
