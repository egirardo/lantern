import { describe, it, expect, vi, afterEach } from 'vitest'
import { rollDie } from './dice'

// The largest number Math.random can return: the double just below 1.
// (Number.EPSILON is the gap between 1 and the next number above it, and the
// gap below 1 is half as big.)
const LARGEST_RANDOM = 1 - Number.EPSILON / 2

describe('rollDie', () => {
  afterEach(() => {
    // Puts Math.random back after the test that replaces it.
    vi.restoreAllMocks()
  })

  // Feeds in the middle of each face's range, (face - 0.5) / sides, so every
  // face of every die the game uses is checked. The ends and the middle alone
  // would miss a formula that gives the first and last faces too few rolls.
  it.each([4, 6, 20])(
    'returns the right number for each face of a d%d',
    (sides) => {
      for (let face = 1; face <= sides; face++) {
        const randomValue = (face - 0.5) / sides
        expect(rollDie(sides, () => randomValue)).toBe(face)
      }
    },
  )

  // Checks where one face ends and the next begins. On a d20 each face covers
  // 1/20 = 0.05 of the range, so 0.05 is the first value that gives a 2.
  it('switches to the next face exactly at the boundary', () => {
    expect(rollDie(20, () => 0.0499)).toBe(1)
    expect(rollDie(20, () => 0.05)).toBe(2)
    expect(rollDie(20, () => 0.9499)).toBe(19)
    expect(rollDie(20, () => 0.95)).toBe(20)
  })

  it('returns 1 when random returns 0', () => {
    expect(rollDie(6, () => 0)).toBe(1)
  })

  // Math.random never returns 1, so this is the biggest roll it can produce.
  it('returns sides when random returns the largest number under 1', () => {
    expect(rollDie(6, () => LARGEST_RANDOM)).toBe(6)
    expect(rollDie(20, () => LARGEST_RANDOM)).toBe(20)
  })

  it('returns 1 for a d1 whatever random returns', () => {
    expect(rollDie(1, () => 0)).toBe(1)
    expect(rollDie(1, () => LARGEST_RANDOM)).toBe(1)
  })

  it.each([0, -3, 2.5, NaN, Infinity])('throws for %s sides', (sides) => {
    expect(() => rollDie(sides)).toThrow(`Invalid number of sides: ${sides}`)
  })

  // A random function that breaks its contract (0 up to but not including 1)
  // should fail loudly, not give a roll like a 21 on a d20.
  it.each([1, 1.5, -0.1, NaN])(
    'throws when random returns %s',
    (randomValue) => {
      expect(() => rollDie(20, () => randomValue)).toThrow(
        `Invalid random value: ${randomValue}`,
      )
    },
  )

  // Without a second argument the die should use Math.random. Replacing it
  // with a fixed value shows that it was really called.
  it('uses Math.random when no random function is given', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    expect(rollDie(6)).toBe(4)
    expect(spy).toHaveBeenCalledOnce()
  })
})
