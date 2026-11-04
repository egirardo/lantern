import { samePosition, type Grid, type Position } from './movement'

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
