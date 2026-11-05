import { samePosition, type Grid, type Position } from './movement'
import type { StoreEnemy } from './spawn-enemies'

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
