import { describe, it, expect } from 'vitest'
import { getVisibleTiles, isLit, getNewlyLit } from './visibility'
import type { Position, Grid } from './movement'
import { makeStoreEnemy } from './test-helpers'

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

describe('isLit', () => {
  const visibleTiles: Position[] = [
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ]

  it('returns true for a tile in the list', () => {
    expect(isLit(visibleTiles, { x: 3, y: 1 })).toBe(true)
  })

  it('returns false for a tile not in the list', () => {
    expect(isLit(visibleTiles, { x: 4, y: 1 })).toBe(false)
  })

  // Compares x and y, not object identity: a new object with the same
  // coordinates (like an enemy's position) must still count as lit.
  it('matches by coordinates, not by the same object', () => {
    const samePlace = { x: 2, y: 1 }
    expect(isLit(visibleTiles, samePlace)).toBe(true)
  })

  it('does not mix up x and y', () => {
    expect(isLit(visibleTiles, { x: 1, y: 2 })).toBe(false)
  })

  it('returns false when nothing is lit', () => {
    expect(isLit([], { x: 2, y: 1 })).toBe(false)
  })
})

describe('getNewlyLit', () => {
  it('returns an enemy that was dark before the step and is lit after it', () => {
    const enemy = makeStoreEnemy('e1', { position: { x: 3, y: 1 } })
    const before: Position[] = [{ x: 1, y: 1 }]
    const after: Position[] = [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
    ]

    expect(getNewlyLit(before, after, [enemy])).toEqual([enemy])
  })

  it('does not return an enemy that was lit before and after the step', () => {
    const enemy = makeStoreEnemy('e1', { position: { x: 3, y: 1 } })
    const before: Position[] = [{ x: 3, y: 1 }]
    const after: Position[] = [
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]

    expect(getNewlyLit(before, after, [enemy])).toEqual([])
  })

  it('does not return an enemy that was lit before and dark after the step', () => {
    const enemy = makeStoreEnemy('e1', { position: { x: 3, y: 1 } })
    const before: Position[] = [{ x: 3, y: 1 }]
    const after: Position[] = [{ x: 4, y: 1 }]

    expect(getNewlyLit(before, after, [enemy])).toEqual([])
  })

  it('does not return an enemy that was never lit', () => {
    const enemy = makeStoreEnemy('e1', { position: { x: 3, y: 1 } })
    const before: Position[] = [{ x: 1, y: 1 }]
    const after: Position[] = [{ x: 4, y: 1 }]

    expect(getNewlyLit(before, after, [enemy])).toEqual([])
  })

  it('returns all lit enemies when the before list is empty', () => {
    const enemy1 = makeStoreEnemy('e1', { position: { x: 3, y: 1 } })
    const enemy2 = makeStoreEnemy('e2', { position: { x: 4, y: 1 } })
    const before: Position[] = []
    const after: Position[] = [
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]

    expect(getNewlyLit(before, after, [enemy1, enemy2])).toEqual([
      enemy1,
      enemy2,
    ])
  })

  it('returns several newly lit enemies in the store order', () => {
    const enemy1 = makeStoreEnemy('e1', { position: { x: 4, y: 1 } })
    const enemy2 = makeStoreEnemy('e2', { position: { x: 1, y: 2 } })
    const enemy3 = makeStoreEnemy('e3', { position: { x: 3, y: 1 } })
    // enemy2 was already lit before the step, so only enemy1 and enemy3 are new.
    const before: Position[] = [{ x: 1, y: 2 }]
    // The lit tiles are in the opposite order to the store (enemy3's tile
    // comes first), so code that loops over the tiles instead of the enemies
    // would return [enemy3, enemy1] and fail.
    const after: Position[] = [
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 4, y: 1 },
    ]

    expect(getNewlyLit(before, after, [enemy1, enemy2, enemy3])).toEqual([
      enemy1,
      enemy3,
    ])
  })

  it('returns an empty array when there are no enemies', () => {
    const before: Position[] = [{ x: 1, y: 1 }]
    const after: Position[] = [
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]

    expect(getNewlyLit(before, after, [])).toEqual([])
  })

  it('does not mutate its inputs', () => {
    const enemies = [makeStoreEnemy('e1', { position: { x: 3, y: 1 } })]
    const before: Position[] = [{ x: 1, y: 1 }]
    const after: Position[] = [
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]
    // structuredClone makes a deep copy: new arrays AND new objects inside
    // them. [...before] would only copy the array, so the copy would still
    // point at the same position objects and change along with them.
    const beforeCopy = structuredClone(before)
    const afterCopy = structuredClone(after)
    const enemiesCopy = structuredClone(enemies)

    getNewlyLit(before, after, enemies)

    expect(before).toEqual(beforeCopy)
    expect(after).toEqual(afterCopy)
    expect(enemies).toEqual(enemiesCopy)
  })
})
