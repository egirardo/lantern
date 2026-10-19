import { roomSchema, type Room } from './room-schema'
import type { Grid, Position } from '../game/movement'
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

  // Check exit positions
  for (const exit of exits) {
    const { position } = exit
    if (!isInsideGrid(grid, position)) {
      throw new Error('Exit position is outside the grid')
    }
    if (isWall(grid, position)) {
      throw new Error('Exit position is inside a wall')
    }
  }
}

function isInsideGrid(grid: Grid, position: Position): boolean {
  const row = grid[position.y]
  return (
    position.y >= 0 &&
    position.y < grid.length &&
    position.x >= 0 &&
    row !== undefined &&
    position.x >= 0 &&
    position.x < row.length
  )
}

function isWall(grid: Grid, position: { x: number; y: number }): boolean {
  return grid[position.y]?.[position.x] === 'wall'
}
