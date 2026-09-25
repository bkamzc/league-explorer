import { HttpError, NetworkError, ResponseFormatError, TimeoutError } from './errors'

export interface GetJsonOptions {
  signal?: AbortSignal
  /** Per-attempt timeout. */
  timeoutMs?: number
  /** Extra attempts for 5xx and timeouts only. */
  retries?: number
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })

// Network errors are deliberately not retried: a rate-limited request looks exactly
// like one (no CORS headers on the 429), and retrying would make the limit worse.
const isRetryable = (error: unknown) =>
  error instanceof TimeoutError ||
  (error instanceof HttpError && (error.status >= 500 || error.status === 408))

async function attempt(
  url: string,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<unknown> {
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(url, { signal: combined, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (signal?.aborted) throw signal.reason
    if (timeout.aborted) throw new TimeoutError(`Timed out after ${timeoutMs} ms`)
    throw new NetworkError(error instanceof Error ? error.message : 'Network request failed')
  }

  if (!response.ok) {
    throw new HttpError(response.status, url, await response.text().catch(() => undefined))
  }

  try {
    return await response.json()
  } catch {
    throw new ResponseFormatError('Response was not valid JSON')
  }
}

/** GET a JSON document with a timeout, typed errors, and jittered retries for idempotent failures. */
export async function getJson(
  url: string,
  { signal, timeoutMs = 10_000, retries = 2 }: GetJsonOptions = {},
) {
  for (let attemptIndex = 0; ; attemptIndex++) {
    try {
      return await attempt(url, signal, timeoutMs)
    } catch (error) {
      if (signal?.aborted || attemptIndex >= retries || !isRetryable(error)) throw error
      const base = 400 * 2 ** attemptIndex
      await sleep(base + Math.random() * base, signal)
    }
  }
}
