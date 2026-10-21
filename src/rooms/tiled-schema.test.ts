import { describe, expect, it } from 'vitest'
import { tiledSchema } from './tiled-schema'
import {
  floorLayer,
  wallsLayer,
  objectLayer,
  validMap,
  newMap,
} from './testing-map'

describe('tiledSchema', () => {
  it('accepts a valid map', () => {
    const result = tiledSchema.safeParse(validMap)
    expect(result.success).toBe(true)
  })

  it('rejects a map without a layers field', () => {
    const invalidMap: Partial<typeof validMap> = newMap()
    delete invalidMap.layers
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['layers'])
  })

  it("rejects a layer whose data length isn't width × height", () => {
    const invalidMap = {
      ...newMap(),
      layers: [{ ...floorLayer, data: [1, 2, 3] }, wallsLayer], // length is 3, but width * height is 9
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['layers', 0, 'data'])
  })

  it('rejects a negative tile ID', () => {
    const invalidMap = {
      ...newMap(),
      layers: [
        { ...floorLayer, data: [1, 2, 3, 4, 5, 6, 7, 8, -1] }, // -1 is invalid
        wallsLayer,
      ],
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['layers', 0, 'data', 8])
  })

  it('rejects an object layer', () => {
    const invalidMap = {
      ...newMap(),
      layers: [floorLayer, wallsLayer, objectLayer],
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['layers', 2, 'type'])
  })

  it('accepts a flipped tile ID', () => {
    // Tile 66 flipped horizontally: Tiled sets the top bit, 2147483648 + 66
    const flippedMap = {
      ...newMap(),
      layers: [
        floorLayer,
        { ...wallsLayer, data: [2147483714, 67, 132, 0, 0, 0, 0, 0, 0] },
      ],
    }
    const result = tiledSchema.safeParse(flippedMap)
    expect(result.success).toBe(true)
  })

  it('rejects an invalid tileset name', () => {
    const invalidMap = {
      ...newMap(),
      tilesets: [
        { firstgid: 1, name: 'dungeon' },
        { firstgid: 100, name: 'castle' },
      ],
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['tilesets', 1, 'name'])
  })

  it('rejects a tileset with a non-positive firstgid', () => {
    const invalidMap = {
      ...newMap(),
      tilesets: [
        { firstgid: 1, name: 'dungeon' },
        { firstgid: 0, name: 'dungeon' },
      ],
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['tilesets', 1, 'firstgid'])
  })

  it('rejects a tileset with the name "name"', () => {
    const invalidMap = {
      ...newMap(),
      tilesets: [
        { firstgid: 1, name: 'dungeon' },
        { firstgid: 100, name: 'name' },
      ],
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['tilesets', 1, 'name'])
  })

  it('rejects a map with tiles and no tilesets', () => {
    const invalidMap = {
      ...newMap(),
      tilesets: [],
    }
    const result = tiledSchema.safeParse(invalidMap)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['tilesets'])
  })
})
