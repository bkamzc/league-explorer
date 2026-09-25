import { describe, expect, it } from 'vitest'
import { ResponseFormatError } from '@/shared/api/errors'
import { fixtures } from '@/test/server'
import {
  isSafeImageUrl,
  parseAlternateNames,
  toLeagues,
  toSeasonBadges,
} from '../api/leagues.mapper'
import { parseLeaguesResponse, parseSeasonsResponse } from '../api/leagues.schema'

const leaguesFrom = (json: unknown) => toLeagues(parseLeaguesResponse(json))

describe('toLeagues', () => {
  it("maps today's free response, which has no alternate names", () => {
    const leagues = leaguesFrom(fixtures.allLeagues.free)
    expect(leagues).toHaveLength(5)
    expect(leagues[0]).toMatchObject({
      id: '4328',
      name: 'English Premier League',
      sport: 'Soccer',
      alternateNames: [],
    })
  })

  it('parses alternate names and drops duplicates and the name itself', () => {
    const [epl, greek, f1, , nfl] = leaguesFrom(fixtures.allLeagues.withAlternates)
    expect(epl!.alternateNames).toEqual(['Premier League', 'EPL'])
    expect(greek!.alternateNames).toEqual([])
    expect(f1!.alternateNames).toEqual(['F1', 'Formula One', 'Formula1', 'Formula-1'])
    expect(nfl!.alternateNames).toEqual([])
  })

  it('cleans messy real-world records', () => {
    const leagues = leaguesFrom(fixtures.allLeagues.edgeCases)
    const byId = new Map(leagues.map((league) => [league.id, league]))
    expect(byId.get('4583')!.alternateNames).toEqual([]) // strLeagueAlternate: null
    expect(byId.get('4738')!.name).toBe('American AHL') // "American \r\nAHL"
    expect(byId.get('4474')!.alternateNames).toContain('ליגת העל‎') // RTL kept verbatim
    expect(byId.get('4866')!.alternateNames.at(-1)).toBe('AFCアジアカップ') // trailing comma
    expect(byId.get('4835')!.sport).toBe('Motorsport') // "Motorsports" alias
  })

  it('makes names and alternate names searchable without accents or case', () => {
    const [epl] = leaguesFrom(fixtures.allLeagues.withAlternates)
    expect(epl!.searchKey).toContain('english premier league')
    expect(epl!.searchKey).toContain('epl')
  })

  it('skips invalid and duplicate records instead of failing the whole list', () => {
    const leagues = leaguesFrom({
      leagues: [
        { idLeague: '1', strLeague: 'Valid', strSport: 'Soccer' },
        { idLeague: '1', strLeague: 'Duplicate id', strSport: 'Soccer' },
        { idLeague: 'abc', strLeague: 'Bad id', strSport: 'Soccer' },
        { idLeague: '2', strLeague: null, strSport: 'Soccer' },
        'not an object',
      ],
    })
    expect(leagues.map((league) => league.name)).toEqual(['Valid'])
  })

  it('treats `leagues: null` as an empty list', () => {
    expect(leaguesFrom({ leagues: null })).toEqual([])
  })
})

describe('parseAlternateNames', () => {
  it('returns [] for empty input', () => {
    expect(parseAlternateNames('', 'X')).toEqual([])
    expect(parseAlternateNames(null, 'X')).toEqual([])
  })
})

describe('toSeasonBadges', () => {
  it('keeps the API order (oldest first) and null badges', () => {
    const seasons = toSeasonBadges(
      parseSeasonsResponse(fixtures.seasonBadges['4424_mixedNullFirst']),
    )
    expect(seasons.map((s) => s.season)).toEqual(['1967', '1976', '1978', '1981', '1986'])
    expect(seasons[0]!.badgeUrl).toBeNull()
  })

  it('sorts by start year and rejects unsafe badge URLs', () => {
    const seasons = toSeasonBadges(
      parseSeasonsResponse({
        seasons: [
          { strSeason: '2001-2002', strBadge: 'javascript:alert(1)' },
          { strSeason: '1999-2000', strBadge: 'http://r2.thesportsdb.com/a.png' },
          { strSeason: '2000-2001', strBadge: 'https://evil.example/a.png' },
        ],
      }),
    )
    expect(seasons.map((s) => s.season)).toEqual(['1999-2000', '2000-2001', '2001-2002'])
    expect(seasons.every((s) => s.badgeUrl === null)).toBe(true)
  })

  it('handles the three shapes of `seasons`', () => {
    expect(parseSeasonsResponse(fixtures.seasonBadges['999999_unknownId'])).toEqual([])
    expect(() => parseSeasonsResponse(fixtures.seasonBadges['abc_invalidId'])).toThrow(
      'Invalid League ID passed',
    )
    expect(() => parseSeasonsResponse({ nope: true })).toThrow(ResponseFormatError)
  })
})

describe('isSafeImageUrl', () => {
  it('allows only https on TheSportsDB image hosts', () => {
    expect(isSafeImageUrl('https://r2.thesportsdb.com/images/a.png')).toBe(true)
    expect(isSafeImageUrl('https://www.thesportsdb.com/images/a.png')).toBe(true)
    expect(isSafeImageUrl('http://r2.thesportsdb.com/images/a.png')).toBe(false)
    expect(isSafeImageUrl('https://r2.thesportsdb.com.evil.example/a.png')).toBe(false)
    expect(isSafeImageUrl('not a url')).toBe(false)
  })
})
