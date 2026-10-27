import { describe, it, expect } from 'vitest'
import { keyToDirection } from './key-to-direction'

describe('keyToDirection', () => {
  it.each([
    ['ArrowUp', 'north'],
    ['ArrowDown', 'south'],
    ['ArrowRight', 'east'],
    ['ArrowLeft', 'west'],
  ])('maps %s to %s', (key, expectedDirection) => {
    expect(keyToDirection(key)).toBe(expectedDirection)
  })

  it('returns undefined for unrecognized keys', () => {
    expect(keyToDirection('a')).toBeUndefined()
    expect(keyToDirection('Enter')).toBeUndefined()
    expect(keyToDirection('Tab')).toBeUndefined() // Undefined means 'not a movement key', so the caller must not call preventDefault, or Tab would get trapped.
    expect(keyToDirection(' ')).toBeUndefined()
  })
})
