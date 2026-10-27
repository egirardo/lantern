export type Position = { x: number; y: number }

export type Direction = 'north' | 'south' | 'east' | 'west'

export type Tile = 'floor' | 'wall'

export type Grid = Tile[][]

export type BlockedReason = 'wall' | 'edge'

export type MoveResult =
  | { moved: true; newPosition: Position }
  | { moved: false; newPosition: Position; reason: BlockedReason }

// Record requires an entry for every Direction, so adding a new direction
// without an offset is a type error instead of a silent zero-step move.
export const DIRECTION_OFFSETS: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
}

export function movePlayer(
  playerPosition: Position,
  direction: Direction,
  grid: Grid,
): MoveResult {
  // Look up how far one step in this direction moves, then add it to the current position
  const offset = DIRECTION_OFFSETS[direction]
  const newX = playerPosition.x + offset.x
  const newY = playerPosition.y + offset.y

  // Get the row the player is moving into. It's undefined when newY is above
  // the top or below the bottom of the grid (and always undefined in an empty grid).
  const targetRow = grid[newY]

  // Check if the new row is outside the grid
  // Must run before the wall check: we can't look up a tile in a row that doesn't exist.
  if (targetRow === undefined) {
    return { moved: false, newPosition: playerPosition, reason: 'edge' }
  }

  // Check if the new column is outside the target row. Uses the target row's own
  // length, not the first row's, because rows could have different lengths.
  if (newX < 0 || newX >= targetRow.length) {
    return { moved: false, newPosition: playerPosition, reason: 'edge' }
  }

  // Check if the new position is a wall
  if (targetRow[newX] === 'wall') {
    return { moved: false, newPosition: playerPosition, reason: 'wall' }
  }

  // If the move is valid, return the new position
  return { moved: true, newPosition: { x: newX, y: newY } }
}
