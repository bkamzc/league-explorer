const COMBINING_MARKS = /[̀-ͯ]/g

/** Trims and collapses any run of whitespace (including stray `\r\n` in API data) to one space. */
export function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** Case- and accent-insensitive form used for matching: "Süper Lig" → "super lig". */
export function foldText(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

/** Splits a search query into folded words. Every word must match, in any order. */
export function searchTokens(query: string): string[] {
  return foldText(cleanWhitespace(query)).split(' ').filter(Boolean)
}

export interface TextSegment {
  text: string
  match: boolean
}

/**
 * Splits `text` into matched and unmatched segments for highlighting.
 * Folding happens per character, so indexes map back to the original string even when
 * accents are stripped.
 */
export function highlightSegments(text: string, tokens: readonly string[]): TextSegment[] {
  if (!tokens.length || !text) return [{ text, match: false }]

  let folded = ''
  const originIndex: number[] = []
  for (let i = 0; i < text.length; i++) {
    for (const char of foldText(text.charAt(i))) {
      folded += char
      originIndex.push(i)
    }
  }

  const ranges: Array<[number, number]> = []
  for (const token of tokens) {
    for (let at = folded.indexOf(token); at !== -1; at = folded.indexOf(token, at + token.length)) {
      ranges.push([originIndex[at]!, originIndex[at + token.length - 1]! + 1])
    }
  }
  if (!ranges.length) return [{ text, match: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([range[0], range[1]])
  }

  const segments: TextSegment[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false })
    segments.push({ text: text.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false })
  return segments
}
