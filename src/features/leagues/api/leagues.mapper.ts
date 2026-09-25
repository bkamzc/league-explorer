import { cleanWhitespace, foldText } from '@/shared/lib/text'
import type { League, SeasonBadge } from '../model/league'
import { seasonStartYear } from '../model/seasons'
import type { LeagueDto, SeasonDto } from './leagues.schema'

/** The API spells a few sports two ways; merge them so the dropdown has one entry each. */
const SPORT_ALIASES: Readonly<Record<string, string>> = {
  ESports: 'Esports',
  Motorsports: 'Motorsport',
}

const IMAGE_HOSTS = new Set(['r2.thesportsdb.com', 'www.thesportsdb.com'])

/** Only https URLs on TheSportsDB's own hosts are rendered; anything else becomes "no badge". */
export function isSafeImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && IMAGE_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

/** "Premier League, EPL, " → ["Premier League", "EPL"], dropping blanks, duplicates and the name itself. */
export function parseAlternateNames(raw: string | null | undefined, name: string): string[] {
  if (!raw) return []
  const seen = new Set([foldText(name)])
  const names: string[] = []
  for (const part of raw.split(',')) {
    const alias = cleanWhitespace(part)
    const key = foldText(alias)
    if (!alias || seen.has(key)) continue
    seen.add(key)
    names.push(alias)
  }
  return names
}

export function toLeague(dto: LeagueDto): League | null {
  const id = dto.idLeague.trim()
  const name = cleanWhitespace(dto.strLeague)
  const rawSport = cleanWhitespace(dto.strSport)
  if (!/^\d+$/.test(id) || !name || !rawSport) return null

  const alternateNames = Object.freeze(parseAlternateNames(dto.strLeagueAlternate, name))
  return Object.freeze({
    id,
    name,
    sport: SPORT_ALIASES[rawSport] ?? rawSport,
    alternateNames,
    // Built once here instead of on every keystroke.
    searchKey: foldText([name, ...alternateNames].join(' | ')),
  })
}

export function toLeagues(dtos: readonly LeagueDto[]): readonly League[] {
  const seen = new Set<string>()
  const leagues: League[] = []
  for (const dto of dtos) {
    const league = toLeague(dto)
    if (!league || seen.has(league.id)) continue
    seen.add(league.id)
    leagues.push(league)
  }
  return Object.freeze(leagues)
}

/** Oldest first, one entry per season, with unsafe or missing badge URLs set to null. */
export function toSeasonBadges(dtos: readonly SeasonDto[]): readonly SeasonBadge[] {
  const bySeason = new Map<string, SeasonBadge>()
  for (const dto of dtos) {
    const season = cleanWhitespace(dto.strSeason)
    if (!season || bySeason.has(season)) continue
    const badge = dto.strBadge?.trim()
    bySeason.set(season, { season, badgeUrl: badge && isSafeImageUrl(badge) ? badge : null })
  }
  return Object.freeze(
    [...bySeason.values()].sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season)),
  )
}
