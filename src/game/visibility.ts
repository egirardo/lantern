import { samePosition, type Grid, type Position } from './movement'

// How far the player's lantern shines, in tiles. The "How to play" rules text
// (docs/sprint-4-plan.md) tells the player they can see three tiles around
// them, so if this number changes, that text must change too.
export const LANTERN_RADIUS = 3

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
