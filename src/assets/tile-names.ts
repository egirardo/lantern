// The tile names table: which map tiles have a name the log can use, like
// "barrel" in "A barrel blocks your path." (Phase K, decision 1). One table
// for every room, so agent-built rooms get the names without extra work.
//
// Plain data and a pure lookup, with no Phaser imports, so game code and
// tests can use it.
import { z } from 'zod'
import { toLocalId } from '../rooms/tile-indices'
import { TILESETS, type TilesetName } from './manifest'
import tileNamesData from './tile-names.json'

// A local tile id as a JSON key: a whole number with no leading zeros, e.g.
// "1099". JSON keys are always strings. Leading zeros are rejected because
// the lookup turns the id back into a string with String(1099), so a key
// like "01099" would never match and the name would be silently ignored.
const localIdKeySchema = z.string().regex(/^(0|[1-9][0-9]*)$/, {
  message: 'Tile id must be a whole number with no leading zeros, e.g. "1099"',
})

// The same kebab-case rule as item and room ids, e.g. "wooden-table". The
// log shows the name with hyphens turned into spaces later (step 3).
const tileNameSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  message:
    'Tile name must be in kebab-case (lowercase letters, numbers, and hyphens)',
})

// The whole table: tileset name -> local id -> name.
//
// partialRecord, not record: in Zod 4, a record whose keys are an enum
// requires *every* key to be present. With one tileset that makes no
// difference, but with a second tileset in TILESETS, every table would have
// to list both. partialRecord makes each tileset optional, while still
// rejecting a tileset name that isn't in TILESETS (a typo like "dungoen").
export const tileNamesSchema = z.partialRecord(
  z.enum(Object.keys(TILESETS) as TilesetName[]),
  z.record(localIdKeySchema, tileNameSchema),
)

export type TileNames = z.infer<typeof tileNamesSchema>

// Parsed once when the file is first imported, so a broken tile-names.json
// fails straight away (in the tests and on page load), like items.json.
export const tileNames = tileNamesSchema.parse(tileNamesData)

// The tileset a gid belongs to, as tiledSchema gives it.
type TilesetRef = {
  name: TilesetName
  firstgid: number
}

/**
 * Looks up the name of the tile at one map cell.
 *
 * @param gid - The gid from the map data. May have flip bits set.
 * @param tileset - The map's tileset (its name and firstgid).
 * @param table - The names table. Defaults to tile-names.json, so normal
 *   code doesn't pass it and tests can pass their own (like itemDisplayName).
 * @returns The name, e.g. 'barrel', or undefined for an empty cell or a
 *   tile with no name.
 */
export function tileNameForGid(
  gid: number,
  tileset: TilesetRef,
  table: TileNames = tileNames,
): string | undefined {
  // 0 means "no tile here" in Tiled, so there's nothing to name.
  if (gid === 0) return undefined

  const localId = toLocalId(gid, tileset.firstgid)
  // Optional chaining (?.) because the tileset may have no entry in the
  // table, and the id may have no name. Both give undefined.
  return table[tileset.name]?.[String(localId)]
}
