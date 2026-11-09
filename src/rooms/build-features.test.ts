import { describe, expect, it } from 'vitest'
import { buildFeatures } from './build-features'

import { tiledSchema } from './tiled-schema'
import { validMap } from './testing-map'

// A valid parsed map of the given size with only these layers, built from
// validMap so it has the real tileset (dungeon, firstgid 1).
function mapWith(
  width: number,
  height: number,
  layers: { name: string; data: number[] }[],
) {
  return tiledSchema.parse({
    ...validMap,
    width,
    height,
    layers: layers.map((layer) => ({ ...layer, type: 'tilelayer' })),
  })
}

describe('buildFeatures', () => {
  it('returns an empty list for a table with no names', () => {
    const map = mapWith(2, 2, [{ name: 'walls', data: [1, 0, 0, 1] }])
    const table = {}
    const features = buildFeatures(map, table)
    expect(features).toEqual([])
  })

  it('finds a named tile on walls', () => {
    const map = mapWith(2, 2, [{ name: 'walls', data: [1, 0, 0, 1] }])
    const table = { dungeon: { '0': 'door' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([
      { position: { x: 0, y: 0 }, name: 'door' },
      { position: { x: 1, y: 1 }, name: 'door' },
    ])
  })

  it('finds a named tile on another layer', () => {
    const map = mapWith(2, 2, [{ name: 'decor', data: [0, 1, 0, 0] }])
    const table = { dungeon: { '0': 'torch' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([{ position: { x: 1, y: 0 }, name: 'torch' }])
  })

  it('ignores unnamed tiles and empty cells', () => {
    const map = mapWith(2, 2, [{ name: 'walls', data: [1, 0, 2, 0] }])
    const table = { dungeon: { '0': 'door' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([{ position: { x: 0, y: 0 }, name: 'door' }])
  })

  it('finds a flipped named tile', () => {
    const map = mapWith(1, 1, [{ name: 'walls', data: [2147483649] }])
    const table = { dungeon: { '0': 'door' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([{ position: { x: 0, y: 0 }, name: 'door' }])
  })

  it("only takes the top layer's name for two named tiles on the same cell", () => {
    const map = mapWith(2, 2, [
      { name: 'walls', data: [1, 0, 0, 0] },
      { name: 'decor', data: [2, 0, 0, 0] },
    ])
    const table = { dungeon: { '0': 'door', '1': 'torch' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([{ position: { x: 0, y: 0 }, name: 'torch' }])
  })

  // Added by Claude Code: without it, reading only the top layer still passed
  // every test. In a real map the barrels are on `walls` with a decor layer
  // above, so that bug would hide every barrel.
  it('finds a named tile on a lower layer when the layer above is empty there', () => {
    const map = mapWith(2, 2, [
      { name: 'walls', data: [1, 0, 0, 0] },
      { name: 'decor', data: [0, 0, 0, 0] },
    ])
    const table = { dungeon: { '0': 'door' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([{ position: { x: 0, y: 0 }, name: 'door' }])
  })

  it('returns several features row by row', () => {
    const map = mapWith(2, 2, [{ name: 'walls', data: [1, 0, 2, 3] }])
    const table = { dungeon: { '0': 'door', '1': 'torch', '2': 'chest' } }
    const features = buildFeatures(map, table)
    expect(features).toEqual([
      { position: { x: 0, y: 0 }, name: 'door' },
      { position: { x: 0, y: 1 }, name: 'torch' },
      { position: { x: 1, y: 1 }, name: 'chest' },
    ])
  })

  it('handles a non-square map (4×2)', () => {
    const map = mapWith(4, 2, [
      { name: 'walls', data: [1, 0, 2, 3, 0, 0, 4, 5] },
    ])
    const table = {
      dungeon: {
        '0': 'door',
        '1': 'torch',
        '2': 'chest',
        '3': 'key',
        '4': 'potion',
      },
    }
    const features = buildFeatures(map, table)
    expect(features).toEqual([
      { position: { x: 0, y: 0 }, name: 'door' },
      { position: { x: 2, y: 0 }, name: 'torch' },
      { position: { x: 3, y: 0 }, name: 'chest' },
      { position: { x: 2, y: 1 }, name: 'key' },
      { position: { x: 3, y: 1 }, name: 'potion' },
    ])
  })
})
