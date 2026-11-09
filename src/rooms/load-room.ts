import { roomSchema, type Room } from './room-schema'
import {
  DIRECTION_OFFSETS,
  type Grid,
  type Position,
  samePosition,
} from '../game/movement'
import { tiledSchema, type TiledMap } from './tiled-schema'
import { buildGrid } from './build-grid'
import { buildFeatures } from './build-features'
import type { Feature } from '../game/features'

export function loadRoom(
  roomData: unknown,
  mapData: unknown,
): { grid: Grid; features: Feature[]; room: Room; tiledMap: TiledMap } {
  // Parse the JSON data
  const room: Room = roomSchema.parse(roomData)
  const tiledMap: TiledMap = tiledSchema.parse(mapData)
  const grid: Grid = buildGrid(tiledMap)
  // The named tiles (barrels and so on), next to the grid, not in it
  // (Phase K, decision 3).
  const features: Feature[] = buildFeatures(tiledMap)

  // Check that the player start and exit positions are valid
  checkPositions(grid, room)
  // Check that every named tile blocks (decided Nov 9)
  checkFeatures(grid, features)
  return { grid, features, room, tiledMap }
}

export function checkPositions(grid: Grid, room: Room) {
  const { playerStart, enemies, exits, items } = room

  // Check player start position
  if (!isInsideGrid(grid, playerStart)) {
    throw new Error('Start position is outside the grid')
  }
  if (isWall(grid, playerStart)) {
    throw new Error('Start position is inside a wall')
  }

  // Check enemy positions
  for (const enemy of enemies) {
    const { position } = enemy
    if (!isInsideGrid(grid, position)) {
      throw new Error(`Enemy ${enemy.id} is outside the grid`)
    }
    if (isWall(grid, position)) {
      throw new Error(`Enemy ${enemy.id} is inside a wall`)
    }
    if (samePosition(enemy.position, playerStart)) {
      throw new Error(`Enemy ${enemy.id} is on the player start position`)
    }
    if (
      enemies
        .filter((e) => e.id !== enemy.id)
        .some((e) => samePosition(e.position, position))
    ) {
      throw new Error(
        `Enemy ${enemy.id} is on the same position as another enemy`,
      )
    }
  }

  // Check item positions. The player picks an item up by stepping on it, so
  // it must lie on a tile inside the grid that isn't a wall.
  for (const item of items) {
    if (!isInsideGrid(grid, item.position)) {
      throw new Error(`Item ${item.id} is outside the grid`)
    }
    if (isWall(grid, item.position)) {
      throw new Error(`Item ${item.id} is inside a wall`)
    }
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

// Named decor (a crate, a pillar) must be on a blocked cell. buildFeatures
// reads every layer, but only the walls layer blocks, so a crate painted on
// the decor layer would be announced ("A crate appears…") while the player
// walks straight through it. Failing here, with the position and the fix,
// catches that in the room file instead of in a playtest. Walk-over decor
// (skulls, rugs) has no name, so it never reaches this check.
export function checkFeatures(grid: Grid, features: Feature[]) {
  for (const feature of features) {
    if (!isWall(grid, feature.position)) {
      const { x, y } = feature.position
      throw new Error(
        `Named decor "${feature.name}" at (${x}, ${y}) is on a walkable tile. Named decor blocks the path, so it must be on the walls layer.`,
      )
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
