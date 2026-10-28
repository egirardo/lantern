import { rollDie } from './dice'

export type Combatant = {
  name: string
  currentHealth: number
  maxHealth: number
  armorClass: number
  attackBonus: number
  // The number of sides on the damage die, e.g. 6 for a d6.
  damageDie: number
}

// A hit or a miss. `hit` is the discriminant (like `moved` in MoveResult): once
// TypeScript knows `hit` is true, it knows `damage` exists, and a miss can't
// have damage at all.
export type CombatResult =
  | {
      hit: true
      // The d20 roll before the attack bonus is added.
      naturalRoll: number
      // naturalRoll + the attacker's attack bonus.
      total: number
      opposingArmorClass: number
      damage: number
      natural20: boolean
    }
  | {
      hit: false
      naturalRoll: number
      total: number
      opposingArmorClass: number
      natural1: boolean
    }

export function attackRoll(
  attacker: Combatant,
  target: Combatant,
  random: () => number = Math.random,
): CombatResult {
  const naturalRoll = rollDie(20, random)
  const total = naturalRoll + attacker.attackBonus
  const opposingArmorClass = target.armorClass

  if (naturalRoll === 20) {
    // Natural 20 always hits
    const damage =
      // Roll damage twice for critical hit
      rollDie(attacker.damageDie, random) + rollDie(attacker.damageDie, random)
    return {
      hit: true,
      naturalRoll,
      total,
      opposingArmorClass,
      damage,
      natural20: true,
    }
  } else if (naturalRoll === 1) {
    // Natural 1 always misses
    return {
      hit: false,
      naturalRoll,
      total,
      opposingArmorClass,
      natural1: true,
    }
  } else if (total >= opposingArmorClass) {
    // Hit
    const damage = rollDie(attacker.damageDie, random)
    return {
      hit: true,
      naturalRoll,
      total,
      opposingArmorClass,
      damage,
      natural20: false,
    }
  } else {
    // Miss
    return {
      hit: false,
      naturalRoll,
      total,
      opposingArmorClass,
      natural1: false,
    }
  }
}

export function applyDamage(combatant: Combatant, damage: number): Combatant {
  const newHealth = Math.max(0, combatant.currentHealth - Math.max(0, damage))
  return { ...combatant, currentHealth: newHealth }
}
