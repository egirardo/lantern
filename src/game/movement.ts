export type Position = { x: number; y: number }

export type Direction = 'north' | 'south' | 'east' | 'west'

export type Tile = 'floor' | 'wall'

export type Grid = Tile[][]

// 'exit': the tile is part of an exit (a door or ladder). Exits are blocked
// tiles like walls, but the log must say how to use them instead of "A wall
// blocks your path".
export type BlockedReason = 'wall' | 'edge' | 'enemy' | 'exit'

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

// The four directions as a list, in a fixed order, for code that tries every
// direction in turn (e.g. looking for an exit next to the player). Written out
// instead of Object.keys(DIRECTION_OFFSETS), because Object.keys returns
// string[], not Direction[].
export const DIRECTIONS: Direction[] = ['north', 'south', 'east', 'west']

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y
}

export function movePlayer(
  playerPosition: Position,
  direction: Direction,
  grid: Grid,
  enemyPositions: Position[] = [],
  // Every tile of every exit in the room. A default of [] keeps the older
  // calls (and tests) that don't care about exits working unchanged.
  exitTiles: Position[] = [],
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

  // Check if the new position is an exit. This must come before the wall
  // check: exit tiles are always walls in the grid (load-room checks that),
  // so the wall check would catch them first and give the wrong reason.
  if (exitTiles.some((tile) => samePosition(tile, { x: newX, y: newY }))) {
    return { moved: false, newPosition: playerPosition, reason: 'exit' }
  }

  // Check if the new position is a wall
  if (targetRow[newX] === 'wall') {
    return { moved: false, newPosition: playerPosition, reason: 'wall' }
  }

  // Check if the new position is blocked by an enemy
  if (
    enemyPositions.some((position) =>
      samePosition(position, { x: newX, y: newY }),
    )
  ) {
    return { moved: false, newPosition: playerPosition, reason: 'enemy' }
  }

  // If the move is valid, return the new position
  return { moved: true, newPosition: { x: newX, y: newY } }
}
