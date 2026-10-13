export type Position = { x: number; y: number }

export type Direction = 'north' | 'south' | 'east' | 'west'

export type Tile = 'floor' | 'wall'

export type Grid = Tile[][]

export type MoveResult =
  | { moved: true; newPosition: Position }
  | { moved: false; newPosition: Position; reason: 'wall' | 'edge' }

// Record requires an entry for every Direction, so adding a new direction
// without an offset is a type error instead of a silent zero-step move.
const DIRECTION_OFFSETS: Record<Direction, Position> = {
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

  // Check if the new position is out of bounds
  // Must run before the wall check: grid[newY] is undefined outside the grid.
  if (newY < 0 || newY >= grid.length || newX < 0 || newX >= grid[0].length) {
    return { moved: false, newPosition: playerPosition, reason: 'edge' }
  }

  // Check if the new position is a wall
  if (grid[newY][newX] === 'wall') {
    return { moved: false, newPosition: playerPosition, reason: 'wall' }
  }

  // If the move is valid, return the new position
  return { moved: true, newPosition: { x: newX, y: newY } }
}
