import { describe, it, expect } from 'vitest'
import { getVisibleTiles } from './visibility'
import type { Position, Grid } from './movement'

const grid: Grid = [
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['floor', 'floor', 'floor', 'floor', 'floor'],
  ['floor', 'floor', 'floor', 'floor', 'floor'],
  ['floor', 'floor', 'floor', 'floor', 'floor'],
  ['floor', 'floor', 'floor', 'floor', 'floor'],
  ['floor', 'floor', 'floor', 'floor', 'floor'],
  ['wall', 'wall', 'wall', 'floor', 'floor'],
]

describe('getVisibleTiles', () => {
  it('returns the correct tiles for a radius of 2', () => {
    const position: Position = { x: 2, y: 1 }
    const visible = getVisibleTiles(grid, position, 2)
    // Round light: a tile is lit when dx² + dy² <= radius² (here <= 4).
    // The corners of the 5×5 square, like (0, 0) with 4 + 1 = 5, are left out.
    const expectedPositions: Position[] = [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]
    expect(visible).toEqual(expect.arrayContaining(expectedPositions))
    expect(visible).toHaveLength(expectedPositions.length)
  })

  it('returns the correct tiles for a radius of 3', () => {
    const position: Position = { x: 2, y: 1 }
    const visible = getVisibleTiles(grid, position, 3)
    // Round light: a tile is lit when dx² + dy² <= radius² (here <= 9).
    // At radius 3 the round light differs from a diamond: (0, 3) and (4, 3) are
    // lit (4 + 4 = 8 <= 9), but a diamond would leave them out (2 + 2 = 4 > 3).
    // (2, 4) is the only lit tile in the bottom row, since 0 + 9 = 9 is the limit.
    const expectedPositions: Position[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 2, y: 4 },
    ]
    expect(visible).toEqual(expect.arrayContaining(expectedPositions))
    expect(visible).toHaveLength(expectedPositions.length)
  })

  it("returns the player's own tile", () => {
    const position: Position = { x: 2, y: 1 }
    const visible = getVisibleTiles(grid, position, 1)
    expect(visible).toContainEqual(position)
  })

  it('returns a tile exactly at the radius', () => {
    const position: Position = { x: 2, y: 1 }
    const visible = getVisibleTiles(grid, position, 2)
    expect(visible).toContainEqual({ x: 4, y: 1 }) // distance is exactly 2
  })

  it('does not return a tile just outside the radius', () => {
    const position: Position = { x: 2, y: 1 }
    const visible = getVisibleTiles(grid, position, 2)
    // dx² + dy² is 4 + 1 = 5, which is more than 2² = 4. The tile is inside the grid.
    expect(visible).not.toContainEqual({ x: 4, y: 2 })
  })

  it('does not return positions outside the grid', () => {
    const position: Position = { x: 1, y: 1 }
    const visible = getVisibleTiles(grid, position, 2)
    // A round light of radius 2 covers 13 tiles. Two of them, (1, -1) and
    // (-1, 1), fall outside the grid, so 11 remain. Without this check the
    // loop below would also pass if the function returned nothing.
    expect(visible).toHaveLength(11)
    for (const pos of visible) {
      // Looking up a tile outside the grid gives undefined (also for a negative index)
      expect(grid[pos.y]?.[pos.x]).toBeDefined()
    }
  })

  // v1 has no line of sight on purpose: the light shines through walls.
  // This test documents that decision, so changing it later is a deliberate choice.
  it('returns wall tiles inside the radius', () => {
    const position: Position = { x: 2, y: 1 }
    const wall: Position = { x: 2, y: 0 }
    // Guard: if someone edits the grid, this test must not pass for the wrong reason
    expect(grid[wall.y]?.[wall.x]).toBe('wall')
    const visible = getVisibleTiles(grid, position, 1)
    expect(visible).toContainEqual(wall)
  })

  it('does not mutate the input position', () => {
    const position: Position = { x: 2, y: 1 }
    const positionCopy = { ...position }
    getVisibleTiles(grid, position, 2)
    expect(position).toEqual(positionCopy)
  })
})
