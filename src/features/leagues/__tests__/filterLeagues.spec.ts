import { describe, expect, it } from 'vitest'
import { searchTokens } from '@/shared/lib/text'
import { toLeagues } from '../api/leagues.mapper'
import { filterLeagues, groupBySport, sportFacets } from '../model/filterLeagues'

const leagues = toLeagues([
  {
    idLeague: '1',
    strLeague: 'English Premier League',
    strSport: 'Soccer',
    strLeagueAlternate: 'EPL',
  },
  { idLeague: '2', strLeague: 'Scottish Premier League', strSport: 'Soccer' },
  { idLeague: '3', strLeague: 'Premier League 2', strSport: 'Soccer' },
  { idLeague: '4', strLeague: 'Süper Lig', strSport: 'Soccer' },
  {
    idLeague: '5',
    strLeague: 'NBA',
    strSport: 'Basketball',
    strLeagueAlternate: 'National Basketball Association',
  },
  { idLeague: '6', strLeague: 'WNBA', strSport: 'Basketball' },
  { idLeague: '7', strLeague: 'NBA G League', strSport: 'Basketball' },
  { idLeague: '8', strLeague: "Women's Big Bash", strSport: 'Cricket' },
  { idLeague: '9', strLeague: '_No League', strSport: 'Soccer' },
  { idLeague: '10', strLeague: 'Formula 1', strSport: 'Motorsport' },
])

const names = (query: string, sport = '') =>
  filterLeagues(leagues, { tokens: searchTokens(query), sport }).map((league) => league.name)

describe('filterLeagues', () => {
  it('returns everything, placeholders last, when there is no filter', () => {
    const all = names('')
    expect(all).toHaveLength(leagues.length)
    expect(all.at(-1)).toBe('_No League')
  })

  it('ignores case, accents and word order', () => {
    expect(names('SUPER')).toEqual(['Süper Lig'])
    expect(names('league premier scottish')).toEqual(['Scottish Premier League'])
  })

  it('matches alternate names', () => {
    expect(names('epl')).toEqual(['English Premier League'])
    expect(names('national basketball')).toEqual(['NBA'])
  })

  it('ranks exact, then prefix, then word prefix, then substring matches', () => {
    expect(names('nba')).toEqual(['NBA', 'NBA G League', 'WNBA'])
    expect(names('premier league')).toEqual([
      'Premier League 2',
      'English Premier League',
      'Scottish Premier League',
    ])
  })

  it('combines search with the sport filter', () => {
    expect(names('league', 'Basketball')).toEqual(['NBA G League'])
    expect(names('', 'Motorsport')).toEqual(['Formula 1'])
  })

  it("handles special characters like ' and & without throwing", () => {
    expect(names("women's")).toEqual(["Women's Big Bash"])
    expect(names('&')).toEqual([])
  })
})

describe('sportFacets', () => {
  it('counts leagues per sport, most leagues first', () => {
    expect(sportFacets(leagues)).toEqual([
      { sport: 'Soccer', count: 5 },
      { sport: 'Basketball', count: 3 },
      { sport: 'Cricket', count: 1 },
      { sport: 'Motorsport', count: 1 },
    ])
  })
})

describe('groupBySport', () => {
  it('groups sorted leagues in facet order and drops empty groups', () => {
    const matches = filterLeagues(leagues, { tokens: searchTokens('league'), sport: '' })
    const groups = groupBySport(matches, sportFacets(leagues))
    expect(groups.map((group) => group.sport)).toEqual(['Soccer', 'Basketball'])
  })
})
