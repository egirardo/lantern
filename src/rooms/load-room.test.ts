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
  it('accepts a room where the start and all exits are on floor tiles', () => {
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

  it('fails when an exit position is inside a wall', () => {
    const room: Room = {
      ...validRoom,
      exits: [{ position: { x: 0, y: 0 }, to: 'room-2' }],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit position is inside a wall',
    )
  })

  it('fails when an exit is just below the bottom edge', () => {
    // Height is 3, so y can be 0–2. y: 3 is the first row outside the grid.
    const room: Room = {
      ...validRoom,
      exits: [{ position: { x: 1, y: 3 }, to: 'room-2' }],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit position is outside the grid',
    )
  })

  it('checks every exit, not just the first', () => {
    // The first exit is fine, the second is far outside the grid.
    const room: Room = {
      ...validRoom,
      exits: [
        { position: { x: 2, y: 2 }, to: 'room-2' },
        { position: { x: 10, y: 10 }, to: 'room-3' },
      ],
    }
    expect(() => checkPositions(grid, room)).toThrow(
      'Exit position is outside the grid',
    )
  })
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
