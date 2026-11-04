import { describe, expect, it } from 'vitest'
import { crossedLowHealth, lowHealthThreshold } from './low-health'
import { makeCombatant } from './test-helpers'

describe('lowHealthThreshold', () => {
  it('is a quarter of max health, rounded down', () => {
    expect(lowHealthThreshold(12)).toBe(3)
  })

  it('rounds down when max health does not divide by 4', () => {
    expect(lowHealthThreshold(11)).toBe(2)
  })
})

describe('crossedLowHealth', () => {
  it('lands just above the threshold', () => {
    const before = makeCombatant({ maxHealth: 12, currentHealth: 12 })
    const after = makeCombatant({ maxHealth: 12, currentHealth: 4 })
    expect(crossedLowHealth(before, after)).toBe(false)
  })

  it('lands exactly on the threshold', () => {
    const before = makeCombatant({ maxHealth: 12, currentHealth: 4 })
    const after = makeCombatant({ maxHealth: 12, currentHealth: 3 })
    expect(crossedLowHealth(before, after)).toBe(true)
  })

  it('already low, drops further', () => {
    const before = makeCombatant({ maxHealth: 12, currentHealth: 3 })
    const after = makeCombatant({ maxHealth: 12, currentHealth: 2 })
    expect(crossedLowHealth(before, after)).toBe(false)
  })

  it('big hit from above to below the threshold', () => {
    const before = makeCombatant({ maxHealth: 12, currentHealth: 12 })
    const after = makeCombatant({ maxHealth: 12, currentHealth: 1 })
    expect(crossedLowHealth(before, after)).toBe(true)
  })

  it('kills the combatant', () => {
    const before = makeCombatant({ maxHealth: 5, currentHealth: 5 })
    const after = makeCombatant({ maxHealth: 5, currentHealth: 0 })
    expect(crossedLowHealth(before, after)).toBe(false)
  })

  it('does not cross the threshold when the combatant is not damaged', () => {
    const before = makeCombatant({ maxHealth: 12, currentHealth: 12 })
    const after = makeCombatant({ maxHealth: 12, currentHealth: 12 })
    expect(crossedLowHealth(before, after)).toBe(false)
  })

  it('works with combatants that have a different max health', () => {
    const before = makeCombatant({ maxHealth: 20, currentHealth: 20 })
    const after = makeCombatant({ maxHealth: 20, currentHealth: 4 })
    expect(crossedLowHealth(before, after)).toBe(true)
  })
})
