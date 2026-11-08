import { samePosition, type Grid, type Position } from './movement'
import type { StoreEnemy } from './spawn-enemies'
// `import type` is erased when the code is built, so src/game/ doesn't load
// anything from src/rooms/ at runtime (the same as in exits.ts).
import type { Exit } from '../rooms/room-schema'

// How far the player's lantern shines, in tiles. It doesn't have to be a whole
// number, because the rule is dx² + dy² <= radius² (here <= 6.25). 2.5 lights
// 2 tiles straight out and the tiles at (±2, ±1) and (±1, ±2) (4 + 1 = 5), but
// not the (±2, ±2) corners (4 + 4 = 8). That gives a rounder shape than 2,
// which would leave out (±2, ±1) and look like a diamond.
// The "How to play" rules text (docs/sprint-4-plan.md) must say "about two
// tiles", so if this number changes, that text must change too.
export const LANTERN_RADIUS = 2.5

function isVisible(from: Position, to: Position, radius: number): boolean {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return dx * dx + dy * dy <= radius * radius
}

export function getVisibleTiles(
  grid: Grid,
  position: Position,
  radius: number,
): Position[] {
  const visibleTiles: Position[] = []

  for (const [y, row] of grid.entries()) {
    for (let x = 0; x < row.length; x++) {
      if (isVisible(position, { x, y }, radius)) {
        visibleTiles.push({ x, y })
      }
    }
  }
  return visibleTiles
}

// Is this tile one of the lit tiles from getVisibleTiles? The Phaser scene asks
// this for every tile (to draw the dark) and every enemy (to show or hide it),
// so the "is it lit" rule stays here instead of in rendering code.
export function isLit(visibleTiles: Position[], position: Position): boolean {
  return visibleTiles.some((tile) => samePosition(tile, position))
}

// The enemies that have just come into the light: lit after the step, but not
// before it. The reveal narration announces exactly these (rule 5: an enemy
// that appears on the canvas must also appear in the log).
// - Every time, not once (decided Nov 4): an enemy that leaves the light and
//   comes back is in the result again, because the player really lost sight
//   of it. So this function remembers nothing between steps. The store does
//   keep `seenEnemyIds`, but only to choose "A skeleton" or "The skeleton" in
//   the log line, not to decide whether an enemy is announced.
// - Loading a room passes an empty `visibleBefore`, so every enemy that is
//   already lit is announced.
// It loops over the enemies, not the tiles, so the result keeps the store's
// order (the same order as the rest of the log). filter() makes a new array
// and never changes the inputs.
export function getNewlyLit(
  visibleBefore: Position[],
  visibleAfter: Position[],
  enemies: StoreEnemy[],
): StoreEnemy[] {
  return enemies.filter(
    (enemy) =>
      isLit(visibleAfter, enemy.position) &&
      !isLit(visibleBefore, enemy.position),
  )
}

// The exits that have just come into the light, so the reveal narration can
// announce doors too (rule 5), not only enemies. Without this, a player who
// can't see the canvas only finds an exit by walking into every wall.
// An exit can cover several tiles (the two-tile door), but it's one exit, so
// it's announced once: it counts as newly lit when at least one of its tiles
// is lit after the step and none of them were lit before. That way the second
// half of a door coming into the light doesn't announce the same door again.
// Otherwise the same rules as getNewlyLit: every time it comes back into the
// light, an empty `visibleBefore` on room load announces every lit exit, the
// result keeps the room file's order, and filter() never changes the inputs.
// The tile closest to `from`. The store passes only the lit tiles of an exit,
// so the direction in the reveal line points at the part of the door the
// player can actually see, not at a half that's still in the dark.
// - Distance uses dx² + dy², the same rule as the lantern (isVisible). The
//   square root isn't needed: if a² < b², then a < b, so comparing squares
//   picks the same tile.
// - A tie keeps the first tile, because `<` (not `<=`) only replaces the
//   nearest tile when another one is strictly closer. That makes the result
//   the same every time.
// - An empty list throws, like directionFrom for the same tile: the store
//   should never ask, so a throw makes that bug show up instead of hiding it.
export function nearestTile(tiles: Position[], from: Position): Position {
  // Destructuring: `first` is tiles[0], and `rest` is a new array of the others.
  const [first, ...rest] = tiles
  if (first === undefined) {
    throw new Error('nearestTile: empty tiles list')
  }

  const distanceSquared = (tile: Position) =>
    (tile.x - from.x) ** 2 + (tile.y - from.y) ** 2

  let nearest = first
  for (const tile of rest) {
    if (distanceSquared(tile) < distanceSquared(nearest)) {
      nearest = tile
    }
  }
  return nearest
}

export function getNewlyLitExits(
  visibleBefore: Position[],
  visibleAfter: Position[],
  exits: Exit[],
): Exit[] {
  return exits.filter(
    (exit) =>
      // some() is true if at least one tile passes the check
      exit.tiles.some((tile) => isLit(visibleAfter, tile)) &&
      !exit.tiles.some((tile) => isLit(visibleBefore, tile)),
  )
}
