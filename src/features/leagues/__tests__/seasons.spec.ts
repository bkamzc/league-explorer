import { describe, expect, it } from 'vitest'
import {
  badgeVariantUrl,
  formatSeason,
  formatSeasonShort,
  latestSeasonWithBadge,
  seasonStartYear,
} from '../model/seasons'

describe('latestSeasonWithBadge', () => {
  it('picks the most recent season that has artwork', () => {
    const seasons = [
      { season: '1992-1993', badgeUrl: 'https://r2.thesportsdb.com/a.png' },
      { season: '1993-1994', badgeUrl: 'https://r2.thesportsdb.com/b.png' },
      { season: '1994-1995', badgeUrl: null },
    ]
    expect(latestSeasonWithBadge(seasons)?.season).toBe('1993-1994')
  })

  it('returns null when no season has a badge', () => {
    expect(latestSeasonWithBadge([{ season: '1892-1893', badgeUrl: null }])).toBeNull()
    expect(latestSeasonWithBadge([])).toBeNull()
  })
})

describe('season labels', () => {
  it('formats full and compact labels without losing the century', () => {
    expect(formatSeason('1992-1993')).toBe('1992–1993')
    expect(formatSeasonShort('1892-1893')).toBe('1892–93')
    expect(formatSeasonShort('1967')).toBe('1967')
    expect(seasonStartYear('2011-2012')).toBe(2011)
  })
})

describe('badgeVariantUrl', () => {
  it('uses TheSportsDB size suffixes', () => {
    expect(badgeVariantUrl('https://r2.thesportsdb.com/a.png', 'small')).toBe(
      'https://r2.thesportsdb.com/a.png/small',
    )
    expect(badgeVariantUrl('https://r2.thesportsdb.com/a.png', 'original')).toBe(
      'https://r2.thesportsdb.com/a.png',
    )
  })
})
