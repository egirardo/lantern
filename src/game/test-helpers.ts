// Helpers shared by the game logic tests. Only tests import this file.
import type { Combatant } from './combat'

// A combatant with sensible defaults, so a test only spells out what matters
// for it, e.g. makeCombatant({ armorClass: 30 }).
export function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
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
export function rollOf(face: number, sides: number): number {
  return (face - 0.5) / sides
}

// A fake random that returns the given values one after another, so a test
// can control the d20 first and then the damage die. It throws if the code
// rolls more often than the test expects.
export function sequence(...values: number[]): () => number {
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
