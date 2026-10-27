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
    const unflipped = gid & 0x1fffffff
    return unflipped - firstgid
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
