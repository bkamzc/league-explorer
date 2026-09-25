import { foldText } from '@/shared/lib/text'
import type { League, SportFacet } from './league'

export interface LeagueFilter {
  /** Folded search words (see `searchTokens`). Every word must match. */
  tokens: readonly string[]
  /** '' means all sports. */
  sport: string
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Lower is better: exact name, name prefix, word prefix, anywhere in the name, alternate name only. */
function matchRank(league: League, tokens: readonly string[]): number {
  if (!tokens.length) return 0
  const name = foldText(league.name)
  const phrase = tokens.join(' ')
  if (name === phrase) return 0
  if (name.startsWith(phrase)) return 1
  if (name.split(/[\s\-/.()]+/).some((word) => word.startsWith(tokens[0]!))) return 2
  if (tokens.every((token) => name.includes(token))) return 3
  return 4
}

export function matchesTokens(league: League, tokens: readonly string[]): boolean {
  return tokens.every((token) => league.searchKey.includes(token))
}

/** TheSportsDB's internal buckets ("_No League", "_Defunct Soccer Teams") aren't real leagues. */
const isPlaceholder = (league: League) => league.name.startsWith('_')

/**
 * Leagues matching the filter: best matches first, then alphabetically with numbers in
 * natural order. Placeholder buckets go last.
 */
export function filterLeagues(
  leagues: readonly League[],
  { tokens, sport }: LeagueFilter,
): League[] {
  return leagues
    .filter((league) => (!sport || league.sport === sport) && matchesTokens(league, tokens))
    .map((league) => ({
      league,
      rank: matchRank(league, tokens),
      placeholder: isPlaceholder(league),
    }))
    .sort(
      (a, b) =>
        Number(a.placeholder) - Number(b.placeholder) ||
        a.rank - b.rank ||
        collator.compare(a.league.name, b.league.name),
    )
    .map(({ league }) => league)
}

/** Sports with league counts, most leagues first: the order used by the dropdown and list groups. */
export function sportFacets(leagues: readonly League[]): SportFacet[] {
  const counts = new Map<string, number>()
  for (const league of leagues) counts.set(league.sport, (counts.get(league.sport) ?? 0) + 1)
  return [...counts]
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => b.count - a.count || collator.compare(a.sport, b.sport))
}

export interface LeagueGroup {
  sport: string
  leagues: League[]
}

/** Groups already-sorted leagues by sport, keeping the given sport order. */
export function groupBySport(
  leagues: readonly League[],
  sportOrder: readonly SportFacet[],
): LeagueGroup[] {
  const groups = new Map<string, League[]>(sportOrder.map(({ sport }) => [sport, []]))
  for (const league of leagues) {
    const group = groups.get(league.sport)
    if (group) group.push(league)
    else groups.set(league.sport, [league])
  }
  return [...groups]
    .filter(([, items]) => items.length)
    .map(([sport, items]) => ({ sport, leagues: items }))
}
