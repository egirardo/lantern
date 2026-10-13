import { describe, it, expect } from 'vitest'
import { movePlayer } from './movement'
import type { Grid } from './movement'

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

  it('should not mutate the original player position', () => {
    const playerPosition = { x: 1, y: 1 }
    const direction = 'south'
    movePlayer(playerPosition, direction, grid)
    expect(playerPosition).toEqual({ x: 1, y: 1 })
  })
})
