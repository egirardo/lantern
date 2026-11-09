import { describe, it, expect } from 'vitest'
import { movePlayer, samePosition } from './movement'
import type { Grid } from './movement'
import type { Feature } from './features'

const grid: Grid = [
  ['floor', 'wall', 'floor'],
  ['floor', 'floor', 'floor'],
  ['floor', 'floor', 'floor'],
]

describe('movePlayer', () => {
  it('should move the player south to open tile', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'south'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 1, y: 2 },
      moved: true,
    })
  })

  it('should move the player north to open tile', () => {
    const playerPosition = { x: 0, y: 1 }
    const direction = 'north'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 0, y: 0 },
      moved: true,
    })
  })

  it('should move the player east to open tile', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'east'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 2, y: 1 },
      moved: true,
    })
  })

  it('should move the player west to open tile', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'west'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 0, y: 1 },
      moved: true,
    })
  })

  it('should not move the player into a wall', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'north'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'wall',
    })
  })

  it('should not move the player north out of bounds', () => {
    const playerPosition = { x: 0, y: 0 }
    const direction = 'north'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 0, y: 0 },
      moved: false,
      reason: 'edge',
    })
  })

  it('should not move the player south out of bounds', () => {
    const playerPosition = { x: 2, y: 2 }
    const direction = 'south'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 2, y: 2 },
      moved: false,
      reason: 'edge',
    })
  })

  it('should not move the player east out of bounds', () => {
    const playerPosition = { x: 2, y: 1 }
    const direction = 'east'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 2, y: 1 },
      moved: false,
      reason: 'edge',
    })
  })

  it('should not move the player west out of bounds', () => {
    const playerPosition = { x: 0, y: 1 }
    const direction = 'west'
    const result = movePlayer(playerPosition, direction, grid)
    expect(result).toEqual({
      newPosition: { x: 0, y: 1 },
      moved: false,
      reason: 'edge',
    })
  })

  // Regression test: x used to be checked against row 0's width, which let the
  // player move onto a missing tile in a shorter row.
  it('should not move the player past the end of a shorter row', () => {
    const raggedGrid: Grid = [
      ['floor', 'floor', 'floor'],
      ['floor', 'floor'],
    ]
    const playerPosition = { x: 1, y: 1 }
    const direction = 'east'
    const result = movePlayer(playerPosition, direction, raggedGrid)
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'edge',
    })
  })

  it('should not move the player on an empty grid', () => {
    const emptyGrid: Grid = []
    const playerPosition = { x: 0, y: 0 }
    const direction = 'east'
    const result = movePlayer(playerPosition, direction, emptyGrid)
    expect(result).toEqual({
      newPosition: { x: 0, y: 0 },
      moved: false,
      reason: 'edge',
    })
  })

  it('should not mutate the original player position', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'south'
    movePlayer(playerPosition, direction, grid)
    expect(playerPosition).toEqual({ x: 1, y: 1 })
  })

  it('should not move the player onto an enemy tile', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'south'
    const enemyPositions = [{ x: 1, y: 2 }]
    const result = movePlayer(playerPosition, direction, grid, enemyPositions)
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'enemy',
    })
  })

  it('should allow the player to move onto a free tile with enemies elsewhere', () => {
    const playerPosition = { x: 0, y: 0 }
    const direction = 'south'
    const enemyPositions = [{ x: 1, y: 2 }]
    const result = movePlayer(playerPosition, direction, grid, enemyPositions)
    expect(result).toEqual({
      newPosition: { x: 0, y: 1 },
      moved: true,
    })
  })

  it('reports an exit, not a wall, when the player walks into an exit tile', () => {
    // (1, 0) is a wall in the grid, like every exit tile.
    const result = movePlayer(
      { x: 1, y: 1 },
      'north',
      grid,
      [],
      [{ x: 1, y: 0 }],
    )
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'exit',
    })
  })

  it('still reports a wall when the exit is somewhere else', () => {
    const result = movePlayer(
      { x: 1, y: 1 },
      'north',
      grid,
      [],
      [{ x: 0, y: 0 }],
    )
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'wall',
    })
  })

  it('should still report a wall when the player encounters a wall', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'north'
    const enemyPositions = [{ x: 1, y: 0 }]
    const result = movePlayer(playerPosition, direction, grid, enemyPositions)
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'wall',
    })
  })

  it('says what blocks the path when the wall has a name', () => {
    const features: Feature[] = [{ position: { x: 1, y: 0 }, name: 'barrel' }]
    const result = movePlayer({ x: 1, y: 1 }, 'north', grid, [], [], features)
    expect(result).toEqual({
      moved: false,
      newPosition: { x: 1, y: 1 },
      reason: 'feature',
      name: 'barrel',
    })
  })

  it('says what blocks the path when the wall has no name', () => {
    const features: Feature[] = [{ position: { x: 1, y: 2 }, name: 'barrel' }]
    const result = movePlayer({ x: 1, y: 1 }, 'north', grid, [], [], features)
    expect(result).toEqual({
      moved: false,
      newPosition: { x: 1, y: 1 },
      reason: 'wall',
    })
  })

  it('allows the player to move onto a feature on a floor tile', () => {
    const features: Feature[] = [{ position: { x: 1, y: 2 }, name: 'barrel' }]
    const result = movePlayer({ x: 1, y: 1 }, 'south', grid, [], [], features)
    expect(result).toEqual({
      moved: true,
      newPosition: { x: 1, y: 2 },
    })
  })

  it('reports an exit when the player walks into an exit tile, even if a feature is there too', () => {
    const features: Feature[] = [{ position: { x: 1, y: 0 }, name: 'barrel' }]
    const result = movePlayer(
      { x: 1, y: 1 },
      'north',
      grid,
      [],
      [{ x: 1, y: 0 }],
      features,
    )
    expect(result).toEqual({
      newPosition: { x: 1, y: 1 },
      moved: false,
      reason: 'exit',
    })
  })
})

describe('samePosition', () => {
  it('is true for the same coordinates, even in two different objects', () => {
    // Two separate objects: === would say false, samePosition compares x and y
    expect(samePosition({ x: 2, y: 3 }, { x: 2, y: 3 })).toBe(true)
  })

  it('is false when only x differs', () => {
    expect(samePosition({ x: 2, y: 3 }, { x: 1, y: 3 })).toBe(false)
  })

  it('is false when only y differs', () => {
    expect(samePosition({ x: 2, y: 3 }, { x: 2, y: 4 })).toBe(false)
  })

  it('gives the same answer whichever position comes first', () => {
    const a = { x: 0, y: 1 }
    const b = { x: 1, y: 0 }
    expect(samePosition(a, b)).toBe(samePosition(b, a))
  })
})
