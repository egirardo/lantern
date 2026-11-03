import { type Direction, type MoveResult, type BlockedReason } from './movement'
import {
  PLAYER_ID,
  type Combatant,
  type CombatEvent,
  type CombatState,
} from './combat'

// Record requires an entry for every BlockedReason, so adding a new reason
// without a corresponding message is a type error instead of a silent default.
const BLOCKED_TEXT: Record<BlockedReason, string> = {
  wall: 'A wall blocks your path',
  edge: 'The edge of the world blocks your path',
  enemy: 'An enemy blocks your path',
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

// The one assertive announcement in the game (see low-health.ts for when it
// fires). "Low health" comes first because an assertive message interrupts
// the screen reader, so the first words should say why. "health" is written
// out, not "HP", because screen readers spell out abbreviations.
export function describeLowHealth(player: Combatant): string {
  return `Low health warning: you have ${player.currentHealth} out of ${player.maxHealth} health remaining.`
}

// The polite line after a won fight. `player` is the player before healing,
// and `amountRecovered` is what recoverHealth actually added after the cap
// (0 to RECOVERY_AMOUNT), so the sentence never claims more than happened.
// This function doesn't cap anything itself: the healing rule lives in
// recovery.ts, and narration only puts it into words.
export function describeRecovery(
  player: Combatant,
  amountRecovered: number,
): string {
  const total = `You have ${player.currentHealth + amountRecovered} out of ${player.maxHealth} health.`

  // "Catch your breath" only when something was actually recovered (your
  // rule, Nov 3). Already at full, the player still gets a line, so every
  // won fight ends the same way and the total is always announced.
  if (amountRecovered > 0) {
    return `You catch your breath and recover ${amountRecovered} health. ${total}`
  } else {
    return `You recover 0 health. ${total}`
  }
}

// The last line of every combat step where the fight goes on: the cue for a
// screen reader user that the enemies are done and they can act. It's read
// right before focus moves to the attack buttons (Phase J decision 5).
export function describeYourTurn(): string {
  return "It's your turn."
}
