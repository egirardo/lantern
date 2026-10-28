import type { Grid, Position } from './movement'

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
