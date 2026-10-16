import { describe, it, expect } from 'vitest'
import { buildGrid } from './build-grid'
import { floorLayer, wallsLayer, validMap } from './testing-map'

describe('buildGrid', () => {
  it('builds a grid from a valid map', () => {
    const result = buildGrid(validMap)
    expect(result).toEqual([
      ['wall', 'wall', 'wall'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ])
  })

  it('treats a map with no walls layer as all floor', () => {
    const mapWithoutWalls = {
      ...validMap,
      layers: [floorLayer],
    }
    const result = buildGrid(mapWithoutWalls)
    expect(result).toEqual([
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ])
  })

  it('treats a flipped tile ID as a wall', () => {
    const mapWithFlippedWall = {
      ...validMap,
      layers: [
        floorLayer,
        // 2147483714 is tile 66 with Tiled's horizontal-flip bit set
        // (2147483648 + 66), so it's non-zero and must still count as a wall.
        { ...wallsLayer, data: [2147483714, 67, 132, 0, 0, 0, 0, 0, 0] },
      ],
    }
    const result = buildGrid(mapWithFlippedWall)
    expect(result).toEqual([
      ['wall', 'wall', 'wall'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ])
  })

  it('finds the walls layer by name, not by position', () => {
    // Same map with the layers in the opposite order. A buildGrid that
    // reads layers[1] would pick the floor layer here and get every tile wrong.
    const mapWithWallsFirst = {
      ...validMap,
      layers: [wallsLayer, floorLayer],
    }
    const result = buildGrid(mapWithWallsFirst)
    expect(result).toEqual([
      ['wall', 'wall', 'wall'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ])
  })

  it('builds a non-square map row by row', () => {
    // A non-square map (4 wide, 2 tall), so mixing up width and height
    // gives the wrong shape. On a 3×3 map the mix-up would go unnoticed.
    // The wall in the bottom-right corner (index 7) also catches a wrong
    // index formula, like data[y * height + x] instead of data[y * width + x].
    const nonSquareMap = {
      ...validMap,
      width: 4,
      height: 2,
      layers: [
        { ...floorLayer, data: [1, 2, 3, 4, 5, 6, 7, 8] },
        { ...wallsLayer, data: [0, 0, 0, 0, 0, 0, 0, 66] },
      ],
    }
    const result = buildGrid(nonSquareMap)
    expect(result).toEqual([
      ['floor', 'floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor', 'wall'],
    ])
  })
})
