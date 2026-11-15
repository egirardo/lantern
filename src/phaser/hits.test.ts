import { describe, it, expect } from 'vitest'
import { hitEnemies, wasHit } from './hits'

// A minimal enemy: only the id and health matter to these helpers.
function enemy(id: string, currentHealth: number) {
  return { id, combatant: { currentHealth } }
}

describe('wasHit', () => {
  it('is true when health goes down', () => {
    expect(wasHit(10, 7)).toBe(true)
  })

  it('is true when health goes down to 0 (a defeated player)', () => {
    expect(wasHit(3, 0)).toBe(true)
  })

  it('is false when health goes up (recovery or a heal at an exit)', () => {
    expect(wasHit(4, 10)).toBe(false)
  })

  it('is false when health stays the same (a miss)', () => {
    expect(wasHit(10, 10)).toBe(false)
  })
})

describe('hitEnemies', () => {
  it('returns the enemies whose health went down', () => {
    const before = [enemy('skeleton-1', 4), enemy('orc-1', 6)]
    const after = [enemy('skeleton-1', 1), enemy('orc-1', 6)]
    expect(hitEnemies(before, after)).toEqual([enemy('skeleton-1', 1)])
  })

  it('returns nothing when no health changed', () => {
    const enemies = [enemy('skeleton-1', 4)]
    expect(hitEnemies(enemies, enemies)).toEqual([])
  })

  it('skips a defeated enemy that is no longer in the list', () => {
    const before = [enemy('skeleton-1', 1)]
    expect(hitEnemies(before, [])).toEqual([])
  })

  it('skips an enemy that was not in the list before (a new room)', () => {
    expect(hitEnemies([], [enemy('skeleton-1', 4)])).toEqual([])
  })

  it('does not count an enemy whose health went up', () => {
    const before = [enemy('skeleton-1', 2)]
    const after = [enemy('skeleton-1', 4)]
    expect(hitEnemies(before, after)).toEqual([])
  })
})
