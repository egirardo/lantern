import { describe, it, expect, vi } from 'vitest'
import { attackRoll, applyDamage } from './combat'
import type { Combatant } from './combat'

function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    name: 'Goblin',
    currentHealth: 5,
    maxHealth: 5,
    armorClass: 12,
    attackBonus: 3,
    damageDie: 6,
    ...overrides,
  }
}

// The random value that makes rollDie give exactly `face` on a die with
// `sides` sides, e.g. rollOf(20, 20) = 0.975 gives a 20. It's the middle of
// that face's range, so it doesn't depend on exact boundaries.
function rollOf(face: number, sides: number): number {
  return (face - 0.5) / sides
}

// A fake random that returns the given values one after another, so a test
// can control the d20 first and then the damage die. It throws if the code
// rolls more often than the test expects.
function sequence(...values: number[]): () => number {
  let next = 0
  return () => {
    const value = values[next]
    next++
    if (value === undefined) {
      throw new Error('random was called more often than the test expected')
    }
    return value
  }
}

describe('attackRoll', () => {
  const attacker = makeCombatant({ name: 'Hero', attackBonus: 3, damageDie: 6 })
  const target = makeCombatant({ armorClass: 12 })

  it('hits when the total is exactly the armor class', () => {
    // 9 + 3 = 12, which is the armor class, so it's a hit.
    const random = sequence(rollOf(9, 20), rollOf(4, 6))
    expect(attackRoll(attacker, target, random)).toEqual({
      hit: true,
      naturalRoll: 9,
      total: 12,
      opposingArmorClass: 12,
      damage: 4,
      natural20: false,
    })
  })

  it('misses when the total is one below the armor class', () => {
    // 8 + 3 = 11, one below 12.
    const random = sequence(rollOf(8, 20))
    expect(attackRoll(attacker, target, random)).toEqual({
      hit: false,
      naturalRoll: 8,
      total: 11,
      opposingArmorClass: 12,
      natural1: false,
    })
  })

  it('hits on a natural 20 even when the total is below the armor class', () => {
    // 20 + 0 = 20, which is below armor class 30, but a natural 20 always hits.
    const weakAttacker = makeCombatant({ attackBonus: 0, damageDie: 6 })
    const armoredTarget = makeCombatant({ armorClass: 30 })
    const random = sequence(rollOf(20, 20), rollOf(3, 6), rollOf(2, 6))
    expect(attackRoll(weakAttacker, armoredTarget, random)).toEqual({
      hit: true,
      naturalRoll: 20,
      total: 20,
      opposingArmorClass: 30,
      damage: 5, // 3 + 2, see the critical hit tests below
      natural20: true,
    })
  })

  // Critical hit, D&D style: a natural 20 rolls the damage die twice and adds
  // the two results, so the damage is between 2 and twice the die.
  it('rolls the damage die twice and adds both on a natural 20', () => {
    const random = vi.fn(sequence(rollOf(20, 20), rollOf(6, 6), rollOf(5, 6)))
    const result = attackRoll(attacker, target, random)
    expect(result).toMatchObject({ hit: true, natural20: true, damage: 11 })
    expect(random).toHaveBeenCalledTimes(3) // attack roll + 2 damage rolls
  })

  it.each([
    [1, 1, 2],
    [6, 6, 12],
  ])(
    'gives the lowest and highest critical damage (%d + %d = %d)',
    (first, second, damage) => {
      const random = sequence(
        rollOf(20, 20),
        rollOf(first, 6),
        rollOf(second, 6),
      )
      expect(attackRoll(attacker, target, random)).toMatchObject({ damage })
    },
  )

  it("uses the attacker's damage die for both critical rolls", () => {
    const daggerAttacker = makeCombatant({ damageDie: 4 })
    const random = sequence(rollOf(20, 20), rollOf(4, 4), rollOf(3, 4))
    const result = attackRoll(daggerAttacker, target, random)
    expect(result).toMatchObject({ natural20: true, damage: 7 })
  })

  it('only rolls damage once on a normal hit, even with a high roll', () => {
    // 19 is not a natural 20, so no critical hit.
    const random = vi.fn(sequence(rollOf(19, 20), rollOf(6, 6)))
    const result = attackRoll(attacker, target, random)
    expect(result).toMatchObject({ natural20: false, damage: 6 })
    expect(random).toHaveBeenCalledTimes(2)
  })

  it('misses on a natural 1 even when the total is above the armor class', () => {
    // 1 + 20 = 21, which is above armor class 10, but a natural 1 always misses.
    const strongAttacker = makeCombatant({ attackBonus: 20 })
    const weakTarget = makeCombatant({ armorClass: 10 })
    const random = sequence(rollOf(1, 20))
    expect(attackRoll(strongAttacker, weakTarget, random)).toEqual({
      hit: false,
      naturalRoll: 1,
      total: 21,
      opposingArmorClass: 10,
      natural1: true,
    })
  })

  // The lowest and highest damage the die can give.
  it.each([1, 6])(
    "rolls damage with the attacker's die, giving %d",
    (damage) => {
      const random = sequence(rollOf(15, 20), rollOf(damage, 6))
      const result = attackRoll(attacker, target, random)
      expect(result).toMatchObject({ hit: true, damage })
    },
  )

  it("uses the attacker's damage die, not a fixed one", () => {
    const daggerAttacker = makeCombatant({ damageDie: 4 })
    const random = sequence(rollOf(15, 20), rollOf(4, 4))
    const result = attackRoll(daggerAttacker, target, random)
    expect(result).toMatchObject({ hit: true, damage: 4 })
  })

  it('rolls the die twice on a hit: once to attack and once for damage', () => {
    const random = vi.fn(sequence(rollOf(15, 20), rollOf(2, 6)))
    attackRoll(attacker, target, random)
    expect(random).toHaveBeenCalledTimes(2)
  })

  it('never rolls the damage die on a miss', () => {
    const random = vi.fn(sequence(rollOf(2, 20)))
    const result = attackRoll(attacker, target, random)
    expect(result.hit).toBe(false)
    expect(result).not.toHaveProperty('damage')
    expect(random).toHaveBeenCalledTimes(1) // only the attack roll
  })
})

describe('applyDamage', () => {
  it('lowers current health by the damage', () => {
    const combatant = makeCombatant({ currentHealth: 5 })
    expect(applyDamage(combatant, 3).currentHealth).toBe(2)
  })

  it('never lowers health below 0', () => {
    const combatant = makeCombatant({ currentHealth: 5 })
    expect(applyDamage(combatant, 10).currentHealth).toBe(0)
  })

  it('brings health to exactly 0 when the damage equals it', () => {
    const combatant = makeCombatant({ currentHealth: 5 })
    expect(applyDamage(combatant, 5).currentHealth).toBe(0)
  })

  it('does not change the original combatant', () => {
    const combatant = makeCombatant({ currentHealth: 5 })
    const result = applyDamage(combatant, 3)
    expect(combatant.currentHealth).toBe(5)
    expect(result).not.toBe(combatant)
  })

  it('keeps every other field the same', () => {
    const combatant = makeCombatant({ currentHealth: 5 })
    expect(applyDamage(combatant, 3)).toEqual({
      ...combatant,
      currentHealth: 2,
    })
  })

  // Damage that isn't positive does nothing. It must never heal.
  it.each([0, -2])('does not change health for %d damage', (damage) => {
    const wounded = makeCombatant({ currentHealth: 3, maxHealth: 5 })
    expect(applyDamage(wounded, damage).currentHealth).toBe(3)
  })
})
