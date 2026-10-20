import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import { loadRoom, checkPositions } from './load-room'
import { validMap, validRoom } from './testing-map'
import type { Grid } from '../game/movement'
import type { Room } from './room-schema'

// The grid that buildGrid makes from validMap:
// [W, W, W]
// [F, F, F]
// [F, F, F]
// Written out by hand, so the checkPositions tests don't depend on buildGrid.
const grid: Grid = [
  ['wall', 'wall', 'wall'],
  ['floor', 'floor', 'floor'],
  ['floor', 'floor', 'floor'],
]

describe('checkPositions', () => {
  // Each test copies validRoom (which fits the grid) and moves one position.
  it('accepts a room with the start on floor and the exits on blocked tiles', () => {
    expect(() => checkPositions(grid, validRoom)).not.toThrow()
  })

  it('fails when the start position is inside a wall', () => {
    const room: Room = { ...validRoom, playerStart: { x: 0, y: 0 } }
    expect(() => checkPositions(grid, room)).toThrow(
      'Start position is inside a wall',
    )
  })

  it('fails when the start position is just right of the right edge', () => {
    // Width is 3, so x can be 0–2. x: 3 catches a `<=` instead of `<` bug.
    const room: Room = { ...validRoom, playerStart: { x: 3, y: 1 } }
    expect(() => checkPositions(grid, room)).toThrow(
      'Start position is outside the grid',
    )
  })

  it('fails when an exit tile is walkable', () => {
    const room: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 1, y: 1 }], to: 'room-2' }],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit tile must be on a blocked tile (a door or ladder)',
    )
  })

  it('fails when an exit is just below the bottom edge', () => {
    // Height is 3, so y can be 0–2. y: 3 is the first row outside the grid.
    const room: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 1, y: 3 }], to: 'room-2' }],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit tile is outside the grid',
    )
  })

  it('checks every exit, not just the first', () => {
    // The first exit is fine, the second is far outside the grid.
    const room: Room = {
      ...validRoom,
      exits: [
        { tiles: [{ x: 2, y: 0 }], to: 'room-2' },
        { tiles: [{ x: 10, y: 10 }], to: 'room-3' },
      ],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit tile is outside the grid',
    )
  })

  it('checks every tile in an exit, not just the first', () => {
    // A two-tile door where the first tile is fine and the second is walkable.
    const room: Room = {
      ...validRoom,
      exits: [
        {
          tiles: [
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ],
          to: 'room-2',
        },
      ],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit tile must be on a blocked tile (a door or ladder)',
    )
  })

  // The walkable-neighbor tests need grids where walls don't all touch the
  // floor, so they build their own. playerStart is always moved onto a floor
  // tile, otherwise the start check would throw before the exit rule runs.

  // (1, 1) is in the middle of the walls: all four neighbors are inside the
  // grid, and all of them are walls. (1, 0) is on the top edge: its only
  // neighbors are walls, and the one to the north is outside the grid.
  const enclosedGrid: Grid = [
    ['wall', 'wall', 'wall'],
    ['wall', 'wall', 'wall'],
    ['wall', 'wall', 'wall'],
    ['floor', 'floor', 'floor'],
  ]

  it('fails when an exit tile has no walkable neighbor', () => {
    const room: Room = {
      ...validRoom,
      playerStart: { x: 1, y: 3 },
      exits: [{ tiles: [{ x: 1, y: 1 }], to: 'room-2' }],
    }
    expect(() => checkPositions(enclosedGrid, room)).toThrow(
      'Exit tile has no walkable neighbor',
    )
  })

  it('does not count a neighbor outside the grid as walkable', () => {
    // isWall is false for a position outside the grid (undefined is not
    // 'wall'), so a check written as "!isWall(neighbor)" would wrongly
    // accept this tile because of the empty space to the north.
    const room: Room = {
      ...validRoom,
      playerStart: { x: 1, y: 3 },
      exits: [{ tiles: [{ x: 1, y: 0 }], to: 'room-2' }],
    }
    expect(() => checkPositions(enclosedGrid, room)).toThrow(
      'Exit tile has no walkable neighbor',
    )
  })

  // it.each runs the same test once per row. $direction in the name is
  // replaced with each row's value, so a failure says which direction broke.
  // Catches a check that forgets a direction (e.g. only looks south, because
  // doors are usually in the top wall).
  it.each([
    { direction: 'north', floor: { x: 1, y: 0 } },
    { direction: 'south', floor: { x: 1, y: 2 } },
    { direction: 'east', floor: { x: 2, y: 1 } },
    { direction: 'west', floor: { x: 0, y: 1 } },
  ])(
    'accepts an exit whose only walkable neighbor is to the $direction',
    ({ floor }) => {
      // A 3×3 grid of walls with a single floor tile next to the center.
      const oneFloorGrid: Grid = [0, 1, 2].map((y) =>
        [0, 1, 2].map((x) =>
          x === floor.x && y === floor.y ? 'floor' : 'wall',
        ),
      )
      const room: Room = {
        ...validRoom,
        playerStart: floor,
        exits: [{ tiles: [{ x: 1, y: 1 }], to: 'room-2' }],
      }
      expect(() => checkPositions(oneFloorGrid, room)).not.toThrow()
    },
  )
})

describe('loadRoom', () => {
  // loadRoom gets both files as raw JSON (unknown), already fetched.
  // Fetching them is Phase E's job, so loadRoom stays pure and easy to test.
  it('returns the validated room and its grid', () => {
    const result = loadRoom(validRoom, validMap)
    expect(result.room).toEqual(validRoom)
    expect(result.grid).toEqual(grid)
  })

  it('fails when the room file is invalid', () => {
    const roomWithoutName: Partial<Room> = { ...validRoom }
    delete roomWithoutName.name
    // Passing the class checks the error is a ZodError, i.e. that it came
    // from roomSchema and not from some other bug.
    expect(() => loadRoom(roomWithoutName, validMap)).toThrow(ZodError)
  })

  it('fails when the map is invalid', () => {
    const mapWithoutLayers = { ...validMap, layers: [] }
    expect(() => loadRoom(validRoom, mapWithoutLayers)).toThrow(
      'Map is missing a floor layer',
    )
  })

  it('fails when a position does not fit the map', () => {
    // Shows that loadRoom actually calls checkPositions.
    const room = { ...validRoom, playerStart: { x: 0, y: 0 } }
    expect(() => loadRoom(room, validMap)).toThrow(
      'Start position is inside a wall',
    )
  })
})
