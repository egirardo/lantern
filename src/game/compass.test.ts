import { describe, expect, it } from 'vitest'
import { directionFrom } from './compass'

describe('directionFrom', () => {
  it('returns north for a tile directly above', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 2, y: 1 })).toBe('north')
  })

  it('returns south for a tile directly below', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 2, y: 3 })).toBe('south')
  })

  it('returns east for a tile directly to the right', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 3, y: 2 })).toBe('east')
  })

  it('returns west for a tile directly to the left', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 1, y: 2 })).toBe('west')
  })

  it('returns east for a tile twice as far east as north', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 4, y: 1 })).toBe('east')
  })

  it('returns south for a tile twice as far south as east', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 3, y: 4 })).toBe('south')
  })

  it('returns south-east for a tile diagonally down and right', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 3, y: 3 })).toBe('south-east')
  })

  it('returns north-west for a tile diagonally up and left', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 1, y: 1 })).toBe('north-west')
  })

  it('returns north-east for a tile diagonally up and right', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 3, y: 1 })).toBe('north-east')
  })

  it('returns south-west for a tile diagonally down and left', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 1, y: 3 })).toBe('south-west')
  })

  it('returns south-east for a tile at the boundary of the diagonal rule', () => {
    expect(directionFrom({ x: 2, y: 2 }, { x: 5, y: 4 })).toBe('south-east')
  })

  it('throws an error when the two positions are the same', () => {
    expect(() => directionFrom({ x: 2, y: 2 }, { x: 2, y: 2 })).toThrow(
      'Cannot determine direction to the same position',
    )
  })
})
