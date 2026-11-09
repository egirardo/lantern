import type { TiledMap } from './tiled-schema'
import type { Feature } from '../game/features'
import { tileNameForGid, tileNames, type TileNames } from '../assets/tile-names'

/**
 * Lists every named tile in the map, on any layer, e.g. the barrels on
 * `walls`. Built once per room in loadRoom, next to the grid.
 *
 * A cell has at most one feature. If two layers have a named tile on the same
 * cell, the top layer wins: Tiled draws layers in order, so the last one is
 * what a sighted player sees (decided Nov 9).
 *
 * @param map - The validated Tiled map.
 * @param table - The names table. Defaults to tile-names.json, so tests can
 *   pass their own (like tileNameForGid).
 * @returns The features, row by row (top to bottom, left to right).
 */
export function buildFeatures(
  map: TiledMap,
  table: TileNames = tileNames,
): Feature[] {
  // Only the first tileset is used, like toTileIndices and drawRoom. A map
  // with a second tileset is an open reminder in the learning notes.
  const tileset = map.tilesets[0]
  if (!tileset) {
    throw new Error('Map has no tileset')
  }

  const features: Feature[] = []
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const index = y * map.width + x
      const name = topNameAt(map, index, tileset, table)
      if (name !== undefined) {
        features.push({ position: { x, y }, name })
      }
    }
  }
  return features
}

// The name of the top named tile in one cell, or undefined if no layer has a
// named tile there. Loops from the last layer down and stops at the first
// name, so a named tile on a lower layer is hidden by one above it.
function topNameAt(
  map: TiledMap,
  index: number,
  tileset: TiledMap['tilesets'][number],
  table: TileNames,
): string | undefined {
  for (let i = map.layers.length - 1; i >= 0; i--) {
    // With noUncheckedIndexedAccess these may be undefined, which can't
    // happen here: i is inside the list, and tiledSchema checks that every
    // layer has width × height tiles. `?.` and `?? 0` keep TypeScript happy
    // without a `!`.
    const gid = map.layers[i]?.data[index] ?? 0
    const name = tileNameForGid(gid, tileset, table)
    if (name !== undefined) return name
  }
  return undefined
}
