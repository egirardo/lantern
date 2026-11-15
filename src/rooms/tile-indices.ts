// Tiled stores flipped and rotated tiles by setting the top bits of the gid
// (horizontal, vertical, diagonal flip, and hexagonal rotation). Masking them
// off gives the plain gid, whichever way the tile is turned.
const TILE_ID_MASK = 0x1fffffff

/**
 * Converts a map gid into the tile's local id in its tileset: the id Tiled
 * shows when you select the tile. Callers handle gid 0 (an empty cell)
 * themselves, because they want different things for it.
 *
 * @param gid - The gid from the map data. May have flip bits set.
 * @param firstgid - The first GID in the tileset.
 * @returns The local id, from 0 up.
 */
export function toLocalId(gid: number, firstgid: number): number {
  // `&` works on signed 32-bit numbers, so a flipped gid is negative in
  // JavaScript. The mask clears the sign bit too, so the result is positive.
  return (gid & TILE_ID_MASK) - firstgid
}

/**
 * Converts a flat list of tile GIDs into a 2D grid of tile indices.
 *
 * @param data - The flat list of tile GIDs.
 * @param width - The width of the grid.
 * @param firstgid - The first GID in the tileset.
 * @returns A 2D array of tile indices.
 */
export function toTileIndices(
  data: readonly number[],
  width: number,
  firstgid: number,
): number[][] {
  // -1 is Phaser's empty tile; Tiled uses 0
  function toIndex(gid: number): number {
    if (gid === 0) return -1
    return toLocalId(gid, firstgid)
  }

  // Split the flat list into rows of the given width.
  const height = data.length / width
  const rows: number[][] = []
  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      const gid = data[index]
      // With noUncheckedIndexedAccess, data[index] may be undefined. That only
      // happens if data.length isn't a multiple of width, i.e. bad map data.
      if (gid === undefined) {
        throw new Error(
          `Tile data has no value at index ${index} (width ${width})`,
        )
      }
      row.push(toIndex(gid))
    }
    rows.push(row)
  }

  return rows
}
