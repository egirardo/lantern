import {
  PLAYER_ID,
  applyDamage,
  attackRoll,
  getCombatStatus,
  type Combatant,
  type CombatEntry,
  type CombatEvent,
  type CombatState,
  type CombatUpdate,
} from './combat'
import { rollDie } from './dice'

export function startCombat(
  player: Combatant,
  enemies: CombatEntry[],
  random: () => number = Math.random,
): CombatUpdate {
  // Check before any dice are rolled, so a bad call doesn't use up random values.
  if (enemies.length === 0) {
    throw new Error('Cannot start combat with no enemies')
  }

  // Everyone in one list: the player first, then the enemies in the order they
  // were given. Each one rolls a d20 in that order (the tests rely on it).
  const everyone: CombatEntry[] = [
    { id: PLAYER_ID, combatant: player },
    ...enemies,
  ]
  const rolls = everyone.map((entry) => {
    const naturalRoll = rollDie(20, random)
    return {
      id: entry.id,
      initiativeRoll: {
        naturalRoll,
        total: naturalRoll + entry.combatant.initiativeBonus,
      },
    }
  })

  // Highest total first. `sort` is stable, so a tie keeps the list order: the
  // player wins ties, and tied enemies stay in the order they were given.
  // Copy first because `sort` changes the array it is called on.
  const sorted = [...rolls].sort(
    (a, b) => b.initiativeRoll.total - a.initiativeRoll.total,
  )

  return {
    state: {
      player,
      enemies,
      turnOrder: sorted.map((roll) => roll.id),
      turnIndex: 0,
    },
    events: sorted.map((roll) => ({
      type: 'initiative',
      combatantId: roll.id,
      initiativeRoll: roll.initiativeRoll,
    })),
  }
}

// Defeated combatants stay in `turnOrder`, so this is how a turn knows to skip them.
function isAlive(state: CombatState, id: string): boolean {
  if (id === PLAYER_ID) {
    return state.player.currentHealth > 0
  }
  const entry = state.enemies.find((enemy) => enemy.id === id)
  return entry !== undefined && entry.combatant.currentHealth > 0
}

// The index of the next living combatant after the current turn. `%` wraps the
// index back to 0 at the end of the order. The last step lands on the current
// turn itself, so a lone survivor gets the next turn too.
function nextLivingIndex(state: CombatState): number {
  const { turnOrder, turnIndex } = state
  for (let step = 1; step <= turnOrder.length; step++) {
    const index = (turnIndex + step) % turnOrder.length
    const id = turnOrder[index]
    if (id !== undefined && isAlive(state, id)) {
      return index
    }
  }
  return turnIndex
}

export function resolvePlayerAttack(
  state: CombatState,
  targetId: string,
  random: () => number = Math.random,
): CombatUpdate {
  // All checks come before any dice are rolled. Each one means a bug in the
  // caller, because the menu only offers a living enemy on the player's turn.
  if (getCombatStatus(state) !== 'ongoing') {
    throw new Error('Combat is already over')
  }
  if (state.turnOrder[state.turnIndex] !== PLAYER_ID) {
    throw new Error("It's not the player's turn")
  }
  const target = state.enemies.find((enemy) => enemy.id === targetId)
  if (target === undefined) {
    throw new Error('Unknown target id')
  }
  if (target.combatant.currentHealth <= 0) {
    throw new Error('Target is already defeated')
  }

  const result = attackRoll(state.player, target.combatant, random)
  const hurtTarget = result.hit
    ? applyDamage(target.combatant, result.damage)
    : target.combatant

  // A new array with a new entry for the target. The old state is not changed.
  const enemies = state.enemies.map((enemy) =>
    enemy.id === targetId ? { ...enemy, combatant: hurtTarget } : enemy,
  )
  const afterAttack: CombatState = { ...state, enemies }

  // Event order: attack, then defeated, then combat-ended.
  const events: CombatEvent[] = [
    { type: 'attack', attackerId: PLAYER_ID, targetId, result },
  ]
  if (hurtTarget.currentHealth <= 0) {
    events.push({ type: 'defeated', combatantId: targetId })
  }

  const status = getCombatStatus(afterAttack)
  if (status !== 'ongoing') {
    // The combat is over, so there is no next turn and turnIndex stays.
    events.push({ type: 'combat-ended', outcome: status })
    return { state: afterAttack, events }
  }

  return {
    state: { ...afterAttack, turnIndex: nextLivingIndex(afterAttack) },
    events,
  }
}
