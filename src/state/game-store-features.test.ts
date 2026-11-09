import { describe, it, expect, vi } from 'vitest'
import { createGameStore } from './game-store'
import { validMap, validRoom, wallsLayer } from '../rooms/testing-map'

// The real tile-names.json has no names yet (they come in Phase K step 4),
// so this file swaps it for a small test table. vi.mock replaces the module
// for every import in this test file, including the one inside
// tile-names.ts. It's in its own file, not in game-store.test.ts, so the
// other store tests keep the real table: once step 3 names a wall tile, their
// "A wall blocks your path." lines could change otherwise.
//
// validMap's walls row is gids 66, 67, 132, so local ids 65, 66, 131
// (firstgid 1). Only 65 is named, so the feature is at (0, 0).
vi.mock('../assets/tile-names.json', () => ({
  default: { dungeon: { '65': 'barrel' } },
}))

describe('game store features', () => {
  it('is empty before a room is loaded', () => {
    const store = createGameStore()
    expect(store.getState().features).toEqual([])
  })

  it('keeps the named tiles of the loaded room', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    expect(store.getState().features).toEqual([
      { position: { x: 0, y: 0 }, name: 'barrel' },
    ])
  })

  it('replaces the features when another room is loaded', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    // The same room with no named walls: 67 is local id 66, not in the table.
    const mapWithoutBarrel = {
      ...validMap,
      layers: [
        validMap.layers[0],
        { ...wallsLayer, data: [67, 67, 67, 0, 0, 0, 0, 0, 0] },
      ],
    }
    store.getState().loadRoom(validRoom, mapWithoutBarrel)
    expect(store.getState().features).toEqual([])
  })
})
