import { type Direction, type MoveResult, type BlockedReason } from './movement'
import { PLAYER_ID, type CombatEvent, type CombatState } from './combat'

// Record requires an entry for every BlockedReason, so adding a new reason
// without a corresponding message is a type error instead of a silent default.
const BLOCKED_TEXT: Record<BlockedReason, string> = {
  wall: 'A wall blocks your path',
  edge: 'The edge of the world blocks your path',
}

function isPlayer(id: string): boolean {
  return id === PLAYER_ID
}

function getName(state: CombatState, id: string): string {
  if (isPlayer(id)) {
    return state.player.name
  }
  const enemy = state.enemies.find((e) => e.id === id)
  if (!enemy) {
    throw new Error(`No combatant with id ${id}`)
  }
  return enemy.combatant.name
}

function describeRoll(natural: number, total: number): string {
  const bonus = total - natural
  if (bonus >= 0) {
    return `${natural} + ${bonus} = ${total}`
  } else {
    return `${natural} - ${Math.abs(bonus)} = ${total}`
  }
}

// The three helpers below turn an id into words. The player is "you" and an
// enemy is "the skeleton". English also changes the verb with the subject
// ("You hit", "The skeleton hits"), so every sentence goes through them
// instead of using the raw name.

// For the start of a sentence: "You" or "The skeleton".
function subject(state: CombatState, id: string): string {
  return isPlayer(id) ? 'You' : `The ${getName(state, id)}`
}

// For after the verb: "you" or "the skeleton".
function object(state: CombatState, id: string): string {
  return isPlayer(id) ? 'you' : `the ${getName(state, id)}`
}

// Both forms are written out, because some verbs don't follow a rule
// ("miss" becomes "misses", "are" becomes "is").
function verb(id: string, playerForm: string, enemyForm: string): string {
  return isPlayer(id) ? playerForm : enemyForm
}

export function describeCombatEvent(
  state: CombatState,
  event: CombatEvent,
): string {
  switch (event.type) {
    case 'attack': {
      const { attackerId, targetId, result } = event
      const who = subject(state, attackerId)
      const target = object(state, targetId)
      // The numbers: what was rolled, and what it had to beat to hit.
      const roll = `${describeRoll(result.naturalRoll, result.total)} against armor class ${result.opposingArmorClass}`
      if (result.hit) {
        if (result.natural20) {
          return `${who} ${verb(attackerId, 'roll', 'rolls')} a natural 20 and ${verb(attackerId, 'land', 'lands')} a critical hit on ${target} for ${result.damage} damage!`
        }
        return `${who} ${verb(attackerId, 'hit', 'hits')} ${target} for ${result.damage} damage (${roll}).`
      }
      if (result.natural1) {
        return `${who} ${verb(attackerId, 'roll', 'rolls')} a natural 1 and ${verb(attackerId, 'miss', 'misses')} ${target}!`
      }
      return `${who} ${verb(attackerId, 'miss', 'misses')} ${target} (${roll}).`
    }
    case 'initiative': {
      const { combatantId, initiativeRoll } = event
      return `${subject(state, combatantId)} ${verb(combatantId, 'roll', 'rolls')} initiative: ${describeRoll(
        initiativeRoll.naturalRoll,
        initiativeRoll.total,
      )}.`
    }
    case 'defeated': {
      const { combatantId } = event
      return `${subject(state, combatantId)} ${verb(combatantId, 'are', 'is')} defeated.`
    }
    case 'combat-ended': {
      return event.outcome === 'victory'
        ? 'Victory. No enemies are left standing.'
        : 'Defeat. The fight is over.'
    }
  }
}

export function describeMove(result: MoveResult, direction: Direction): string {
  if (result.moved) {
    return `You have taken a step to the ${direction}.`
  } else {
    return `You cannot move to the ${direction}. ${BLOCKED_TEXT[result.reason]}.`
  }
}
