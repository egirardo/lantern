import { roomSchema, type Room } from './room-schema'
import { DIRECTION_OFFSETS, type Grid, type Position } from '../game/movement'
import { tiledSchema, type TiledMap } from './tiled-schema'
import { buildGrid } from './build-grid'

export function loadRoom(
  roomData: unknown,
  mapData: unknown,
): { grid: Grid; room: Room } {
  // Parse the JSON data
  const room: Room = roomSchema.parse(roomData)
  const map: TiledMap = tiledSchema.parse(mapData)
  const grid: Grid = buildGrid(map)

  // Check that the player start and exit positions are valid
  checkPositions(grid, room)
  return { grid, room }
}

export function checkPositions(grid: Grid, room: Room) {
  const { playerStart, exits } = room

  // Check player start position
  if (!isInsideGrid(grid, playerStart)) {
    throw new Error('Start position is outside the grid')
  }
  if (isWall(grid, playerStart)) {
    throw new Error('Start position is inside a wall')
  }

  // Check exit tiles. Exits are doors or ladders the player interacts with,
  // so every tile must be blocked, not walkable.
  for (const exit of exits) {
    for (const tile of exit.tiles) {
      if (!isInsideGrid(grid, tile)) {
        throw new Error('Exit tile is outside the grid')
      }
      if (!isWall(grid, tile)) {
        throw new Error(
          'Exit tile must be on a blocked tile (a door or ladder)',
        )
      }
      // The player opens an exit by walking into it, so they must be able to
      // stand next to it. Otherwise the exit can never be used.
      if (!hasWalkableNeighbor(grid, tile)) {
        throw new Error('Exit tile has no walkable neighbor')
      }
    }
  }
}

function isInsideGrid(grid: Grid, position: Position): boolean {
  const row = grid[position.y]
  return (
    position.y >= 0 &&
    position.y < grid.length &&
    row !== undefined &&
    position.x >= 0 &&
    position.x < row.length
  )
}

function isWall(grid: Grid, position: Position): boolean {
  return grid[position.y]?.[position.x] === 'wall'
}

// True if at least one of the four tiles next to `position` is floor.
function hasWalkableNeighbor(grid: Grid, position: Position): boolean {
  // Object.values turns the offsets record into a list of { x, y } steps.
  // .some() returns true as soon as one step lands on a floor tile.
  return Object.values(DIRECTION_OFFSETS).some((offset) =>
    isFloor(grid, { x: position.x + offset.x, y: position.y + offset.y }),
  )
}

// Checks for 'floor' instead of "not 'wall'": outside the grid the lookup is
// undefined, and undefined is not 'wall', so !isWall would count the empty
// space beyond the edge as walkable.
function isFloor(grid: Grid, position: Position): boolean {
  return grid[position.y]?.[position.x] === 'floor'
}
