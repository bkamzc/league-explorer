import { describe, expect, it } from 'vitest'
import { cleanWhitespace, foldText, highlightSegments, searchTokens } from '../lib/text'

describe('cleanWhitespace', () => {
  it('collapses stray CR/LF and repeated spaces from API data', () => {
    expect(cleanWhitespace('American \r\nAHL  ')).toBe('American AHL')
  })
})

describe('foldText', () => {
  it('ignores case and accents', () => {
    expect(foldText('Süper Lig')).toBe('super lig')
    expect(foldText('Albanian Kategoria e Parë')).toBe('albanian kategoria e pare')
  })
})

describe('searchTokens', () => {
  it('splits a query into folded words and drops blanks', () => {
    expect(searchTokens('  Prem   ENG ')).toEqual(['prem', 'eng'])
    expect(searchTokens('   ')).toEqual([])
  })
})

describe('highlightSegments', () => {
  it('marks every match and keeps the original text, accents included', () => {
    expect(highlightSegments('Süper Lig', ['super'])).toEqual([
      { text: 'Süper', match: true },
      { text: ' Lig', match: false },
    ])
  })

  it('merges overlapping matches from several words', () => {
    const segments = highlightSegments('English Premier League', ['prem', 'premier', 'eng'])
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(['Eng', 'Premier'])
    expect(segments.map((s) => s.text).join('')).toBe('English Premier League')
  })

  it('returns the text untouched when nothing matches', () => {
    expect(highlightSegments('NBA', ['nfl'])).toEqual([{ text: 'NBA', match: false }])
  })
})
