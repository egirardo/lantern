// Helpers shared by the game logic tests. Only tests import this file.
import { PLAYER_ID, type Combatant, type CombatState } from './combat'

// A combatant with sensible defaults, so a test only spells out what matters
// for it, e.g. makeCombatant({ armorClass: 30 }).
export function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    name: 'Goblin',
    currentHealth: 5,
    maxHealth: 5,
    initiativeBonus: 0,
    armorClass: 12,
    attackBonus: 3,
    damageDie: 6,
    ...overrides,
  }
}

// A helper to create a combat state with sensible defaults, so a test only spells out what matters
// for it, e.g. makeState({ enemies: [] }).
export function makeState({
  player,
  enemies,
  turnOrder,
  turnIndex,
}: Partial<CombatState> = {}): CombatState {
  return {
    player: player ?? makeCombatant({ name: 'Hero' }),
    enemies: enemies ?? [
      { id: 'e1', combatant: makeCombatant({ name: 'Goblin 1' }) },
    ],
    turnOrder: turnOrder ?? [PLAYER_ID, 'e1'],
    turnIndex: turnIndex ?? 0,
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

// A fight where it's the player's turn, with enemies e1, e2, ... that have the
// given health, e.g. makeFight(5, 3). The player has +2 to hit and a d6, and
// every enemy has armor class 12.
export function makeFight(...enemyHealth: number[]): CombatState {
  const enemies = enemyHealth.map((currentHealth, index) => ({
    id: `e${index + 1}`,
    combatant: makeCombatant({ currentHealth }),
  }))
  return makeState({
    player: makeCombatant({ attackBonus: 2, damageDie: 6 }),
    enemies,
    turnOrder: [PLAYER_ID, ...enemies.map((enemy) => enemy.id)],
  })
}

// The random values for a hit (a 15 + 2 = 17 beats armor class 12) that does
// `damage` damage.
export function hitRoll(damage: number): () => number {
  return sequence(rollOf(15, 20), rollOf(damage, 6))
}

// The attack event for that hit (or, with a natural roll of 20, a critical).
export function hitEvent(targetId: string, damage: number, naturalRoll = 15) {
  return {
    type: 'attack',
    attackerId: PLAYER_ID,
    targetId,
    result: {
      hit: true,
      naturalRoll,
      total: naturalRoll + 2,
      opposingArmorClass: 12,
      damage,
      natural20: naturalRoll === 20,
    },
  }
}

// The health of each enemy in order, e.g. [5, 0].
export function healths(state: CombatState): number[] {
  return state.enemies.map((enemy) => enemy.combatant.currentHealth)
}
