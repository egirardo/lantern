import { describe, expect, it } from 'vitest'
import { toTileIndices } from './tile-indices'

describe('toTileIndices', () => {
  it('splits the list into rows of width', () => {
    const data = [1, 0, 5, 2, 2, 0]
    const width = 3
    const firstgid = 1
    const expected = [
      [0, -1, 4],
      [1, 1, -1],
    ]
    expect(toTileIndices(data, width, firstgid)).toEqual(expected)
  })

  it('uses firstgid, not a fixed 1', () => {
    const data = [10, 12]
    const width = 2
    const firstgid = 10
    const expected = [[0, 2]]
    expect(toTileIndices(data, width, firstgid)).toEqual(expected)
  })

  it('keeps empty cells at -1 with any firstgid', () => {
    const data = [0, 10]
    const width = 2
    const firstgid = 10
    const expected = [[-1, 0]]
    expect(toTileIndices(data, width, firstgid)).toEqual(expected)
  })

  it('draws a flipped tile as its normal tile', () => {
    const data = [2147483714]
    const width = 1
    const firstgid = 1
    const expected = [[65]]
    expect(toTileIndices(data, width, firstgid)).toEqual(expected)
  })

  it("doesn't change the input", () => {
    const data = [1, 2]
    const before = [...data]
    toTileIndices(data, 2, 1)
    expect(data).toEqual(before)
  })

  it('throws if data.length is not a multiple of width', () => {
    const data = [1, 2, 3]
    const width = 2
    const firstgid = 1
    expect(() => toTileIndices(data, width, firstgid)).toThrow(
      'Tile data has no value at index 3 (width 2)',
    )
  })

  it('returns no rows for empty data', () => {
    const data: number[] = []
    const width = 2
    const firstgid = 1
    expect(toTileIndices(data, width, firstgid)).toEqual([])
  })
})
