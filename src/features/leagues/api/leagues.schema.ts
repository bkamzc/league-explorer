import * as z from 'zod/mini'
import { ResponseFormatError } from '@/shared/api/errors'

/*
 * Runtime schemas for TheSportsDB v1 responses. The API is third-party and crowd-edited,
 * so nothing is trusted until it passes here. Shapes verified against live responses
 * on 2026-09-25 (see src/features/leagues/__tests__/fixtures).
 */

export const LeagueDtoSchema = z.looseObject({
  idLeague: z.string(),
  strLeague: z.string(),
  strSport: z.string(),
  // Absent on today's free tier; "" / null / comma-separated list elsewhere.
  strLeagueAlternate: z.optional(z.nullable(z.string())),
})

const AllLeaguesResponseSchema = z.looseObject({
  leagues: z.nullable(z.array(z.unknown())),
})

export const SeasonDtoSchema = z.looseObject({
  strSeason: z.string(),
  strBadge: z.optional(z.nullable(z.string())),
})

// `seasons` is an array, null (unknown id / no seasons) or, for a malformed id, the
// string "Invalid League ID passed". All three come back with HTTP 200.
const SeasonsResponseSchema = z.looseObject({
  seasons: z.union([z.array(z.unknown()), z.null(), z.string()]),
})

export type LeagueDto = z.infer<typeof LeagueDtoSchema>
export type SeasonDto = z.infer<typeof SeasonDtoSchema>

/** Validates the envelope strictly and each league leniently: one bad record doesn't sink the list. */
export function parseLeaguesResponse(json: unknown): LeagueDto[] {
  const envelope = z.safeParse(AllLeaguesResponseSchema, json)
  if (!envelope.success) throw new ResponseFormatError('Unexpected all_leagues response')
  return (envelope.data.leagues ?? []).flatMap((item) => {
    const league = z.safeParse(LeagueDtoSchema, item)
    return league.success ? [league.data] : []
  })
}

export function parseSeasonsResponse(json: unknown): SeasonDto[] {
  const envelope = z.safeParse(SeasonsResponseSchema, json)
  if (!envelope.success) throw new ResponseFormatError('Unexpected search_all_seasons response')
  const { seasons } = envelope.data
  if (typeof seasons === 'string') throw new ResponseFormatError(seasons)
  return (seasons ?? []).flatMap((item) => {
    const season = z.safeParse(SeasonDtoSchema, item)
    return season.success ? [season.data] : []
  })
}
