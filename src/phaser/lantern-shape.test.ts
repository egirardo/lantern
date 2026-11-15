import { describe, it, expect } from 'vitest'
import { litOffsets } from './lantern-shape'
import type { Grid } from '../game/movement'
import { getVisibleTiles, isLit, LANTERN_RADIUS } from '../game/visibility'

describe('litOffsets', () => {
  it('lights 2 tiles straight out and (±2, ±1), but not the (±2, ±2) corners', () => {
    const offsets = litOffsets(LANTERN_RADIUS)
    expect(offsets).toContainEqual({ x: 0, y: 0 })
    expect(offsets).toContainEqual({ x: 2, y: 0 })
    expect(offsets).toContainEqual({ x: -2, y: 1 })
    expect(offsets).toContainEqual({ x: 1, y: -2 })
    expect(offsets).not.toContainEqual({ x: 2, y: 2 })
    expect(offsets).not.toContainEqual({ x: 3, y: 0 })
    // The 5×5 square minus its 4 corners.
    expect(offsets).toHaveLength(21)
  })

  it('matches isLit for a player in the middle of a real-sized room', () => {
    // A 12×10 room, the size of every map, with the player away from the
    // edges, so the room's edge cuts nothing off.
    const grid: Grid = Array.from({ length: 10 }, () =>
      Array.from({ length: 12 }, () => 'floor' as const),
    )
    const player = { x: 5, y: 5 }
    const visibleTiles = getVisibleTiles(grid, player, LANTERN_RADIUS)
    const offsets = litOffsets(LANTERN_RADIUS)
    for (const [y, row] of grid.entries()) {
      for (let x = 0; x < row.length; x++) {
        const offset = { x: x - player.x, y: y - player.y }
        const inShape = offsets.some(
          (tile) => tile.x === offset.x && tile.y === offset.y,
        )
        expect(inShape).toBe(isLit(visibleTiles, { x, y }))
      }
    }
  })
})
