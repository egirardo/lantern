import { rollDie } from './dice'

export type Combatant = {
  name: string
  currentHealth: number
  maxHealth: number
  armorClass: number
  initiativeBonus: number
  attackBonus: number
  // The number of sides on the damage die, e.g. 6 for a d6.
  damageDie: number
}

export const PLAYER_ID = 'player'

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

export type InitiativeResult = {
  naturalRoll: number
  total: number
}

export type CombatEntry = { id: string; combatant: Combatant }

export type CombatStatus = 'ongoing' | 'victory' | 'defeat'

// Decisions (each one needs a test):
// - Defeated combatants stay in `enemies` and in `turnOrder` and are skipped
//   when the turn advances. The order never changes after the start and the
//   narration can still look up their name.
// - `initiative` events come in the final sorted order (first actor first),
//   which reads best in the log ("Skeleton goes first").
// - turnIndex right after startCombat is 0, and the first actor may be an
//   enemy.
// - An unknown or already defeated target id throws, like rollDie does. It
//   means a bug in the caller, because the menu only offers living enemies.
// - resolvePlayerAttack also throws when it isn't the player's turn or the
//   combat is already over. Same reason: the UI should never allow it.
// - It does not run the enemies' turns (that is resolveEnemyTurns). After the
//   attack, turnIndex moves to the next living combatant, wrapping around the
//   end of turnOrder. If the attack ended the combat, turnIndex stays.
// - Event order for one attack: attack, then defeated, then combat-ended.
export type CombatState = {
  player: Combatant
  enemies: CombatEntry[]
  turnOrder: string[]
  turnIndex: number
}

export type CombatEvent =
  | {
      type: 'initiative'
      combatantId: string
      initiativeRoll: InitiativeResult
    }
  | {
      type: 'attack'
      attackerId: string
      targetId: string
      result: CombatResult
    }
  | {
      type: 'defeated'
      combatantId: string
    }
  | {
      type: 'combat-ended'
      outcome: 'victory' | 'defeat'
    }

export type CombatUpdate = { state: CombatState; events: CombatEvent[] }

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

export function getCombatStatus(state: CombatState): CombatStatus {
  if (state.player.currentHealth <= 0) {
    return 'defeat'
  } else if (
    state.enemies.every((entry) => entry.combatant.currentHealth <= 0)
  ) {
    return 'victory'
  } else {
    return 'ongoing'
  }
}
