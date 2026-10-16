import { describe, expect, it } from 'vitest'
import { tiledSchema } from './tiled-schema'

const floorLayer = {
  data: [258, 258, 258, 259, 260, 324, 323, 266, 258],
  height: 3,
  id: 2,
  name: 'floor',
  opacity: 1,
  type: 'tilelayer',
  visible: true,
  width: 3,
  x: 0,
  y: 0,
}

const wallsLayer = {
  data: [66, 67, 132, 0, 0, 0, 0, 0, 0],
  height: 3,
  id: 1,
  name: 'walls',
  opacity: 1,
  type: 'tilelayer',
  visible: true,
  width: 3,
  x: 0,
  y: 0,
}

// What Tiled actually exports for an object layer: `objects` instead of `data`.
const objectLayer = {
  draworder: 'topdown',
  id: 3,
  name: 'objects',
  objects: [],
  opacity: 1,
  type: 'objectgroup',
  visible: true,
  x: 0,
  y: 0,
}

const validMap = {
  compressionlevel: -1,
  height: 3,
  infinite: false,
  layers: [floorLayer, wallsLayer],
  nextlayerid: 3,
  nextobjectid: 1,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.12.2',
  tileheight: 16,
  tilesets: [
    {
      columns: 64,
      firstgid: 1,
      image: '../lantern/public/assets/dungeon/dungeontileset-extended.png',
      imageheight: 1024,
      imagewidth: 1024,
      margin: 0,
      name: 'dungeon',
      spacing: 0,
      tilecount: 4096,
      tileheight: 16,
      tilewidth: 16,
    },
  ],
  tilewidth: 16,
  type: 'map',
  version: '1.10',
  width: 3,
}

function newMap() {
  return structuredClone(validMap)
}

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
})
