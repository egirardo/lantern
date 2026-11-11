import type { Grid, Position } from '../game/movement'
import { getVisibleTiles } from '../game/visibility'

// The lit tiles around the player, as steps from the player's own tile:
// { x: 0, y: 0 } is the player's tile, { x: 2, y: -1 } is two east and one
// north. The high contrast dark (room-scene.ts) cuts one clear square per
// offset into a black picture, so the hard edge shows exactly the tiles that
// getVisibleTiles calls lit.
//
// Why offsets instead of the room's lit tiles: the lit shape is the same
// wherever the player stands (only the room's edge cuts it off, and past the
// edge there is nothing to draw anyway). So the picture can be painted once
// and moved with the player, like the soft dark, and slide with the walk.
//
// The rule itself isn't repeated here: it asks getVisibleTiles (rule 1, game
// logic in src/game/) about a small empty square room with the player in the
// middle, just big enough to hold the whole light.
export function litOffsets(radius: number): Position[] {
  // How many tiles the light can reach in each direction, e.g. 2 for 2.5.
  const reach = Math.floor(radius)
  const size = reach * 2 + 1
  // Array.from with a length makes `size` rows of `size` floor tiles. The
  // tile type doesn't matter to getVisibleTiles, only the grid's size.
  const grid: Grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'floor' as const),
  )
  const centre = { x: reach, y: reach }
  return getVisibleTiles(grid, centre, radius).map((tile) => ({
    x: tile.x - centre.x,
    y: tile.y - centre.y,
  }))
}
