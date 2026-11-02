import {
  getCombatStatus,
  type Combatant,
  type CombatState,
  type CombatUpdate,
} from './combat'
import { syncFromCombat } from './combat-sync'
import {
  resolveEnemyTurns,
  resolvePlayerAttack,
  startCombat,
} from './combat-turns'
import { crossedLowHealth } from './low-health'
import { describeCombatEvent, describeLowHealth } from './narration'
import type { StoreEnemy } from './spawn-enemies'

// The store's two combat moments (a fight starts, the player attacks) each
// call several pure functions in a fixed order. This file does that ordering,
// so the store actions only call one function and `set` the result, and the
// whole flow can be tested without a store (rule 1).

// One line for the adventure log. The store adds the id, because a random
// UUID would make these functions impossible to test with exact values.
export type LogLine = { text: string; urgency: 'polite' | 'assertive' }

// Everything the store needs to set after a combat step.
export type CombatStep = {
  player: Combatant
  enemies: StoreEnemy[]
  // null once the fight is over, for victory and defeat alike. Game over is
  // read from the player's health, not from a separate field.
  combat: CombatState | null
  lines: LogLine[]
}

// A fight starts: the adjacent enemies roll initiative with the player, and
// any enemy that goes first acts before the player gets a turn.
// `adjacent` is what getAdjacentEnemies returned; deciding who is adjacent
// is the caller's job, because this function doesn't know where anyone is.
export function beginCombat(
  player: Combatant,
  enemies: StoreEnemy[],
  adjacent: StoreEnemy[],
  random: () => number = Math.random,
): CombatStep {
  // The combat only needs { id, combatant }. Type and position stay in the
  // store, and syncFromCombat puts them back together afterwards.
  const entries = adjacent.map(({ id, combatant }) => ({ id, combatant }))
  const started = startCombat(player, entries, random)

  // Safe to call even if the player won initiative: resolveEnemyTurns returns
  // the state unchanged, with no events and no dice, when it's already the
  // player's turn. So there's no "who goes first?" check here.
  const enemyTurns = resolveEnemyTurns(started.state, random)

  // One update for the whole step: the newest state, and the events of both
  // calls in the order they happened.
  return finishStep(player, enemies, {
    state: enemyTurns.state,
    events: [...started.events, ...enemyTurns.events],
  })
}

// The player attacks `targetId`, and then the enemies act if the fight goes
// on. Called by the store when the player picks Attack in the action menu.
export function playerAttackStep(
  combat: CombatState,
  enemies: StoreEnemy[],
  targetId: string,
  random: () => number = Math.random,
): CombatStep {
  const attack = resolvePlayerAttack(combat, targetId, random)

  // resolveEnemyTurns throws on a finished fight (a wrong call is a bug), so
  // it only runs when the attack didn't end the combat. If it did, the step
  // is just the attack, with no enemy turns and no extra dice.
  const enemyTurns =
    getCombatStatus(attack.state) === 'ongoing'
      ? resolveEnemyTurns(attack.state, random)
      : { state: attack.state, events: [] }

  // `combat.player` is the player before this step, for the low-health check.
  return finishStep(combat.player, enemies, {
    state: enemyTurns.state,
    events: [...attack.events, ...enemyTurns.events],
  })
}

// The cleanup after every combat step, shared by beginCombat and
// playerAttackStep. `playerBefore` is the player from before the step, so
// the low-health check can compare before and after.
function finishStep(
  playerBefore: Combatant,
  enemies: StoreEnemy[],
  update: CombatUpdate,
): CombatStep {
  // 1. Copy health back to the store's player and enemies, and drop the dead.
  const synced = syncFromCombat(enemies, update.state)

  // 2. One polite line per event. Narration gets the newest state, which
  //    still has defeated enemies in it, so it can find their names.
  //    `: LogLine` on the arrow function tells TypeScript that 'polite' is
  //    the urgency type, not just any string.
  const lines = update.events.map((event): LogLine => ({
    text: describeCombatEvent(update.state, event),
    urgency: 'polite',
  }))

  // 3. The low-health warning goes last, after everything that happened in
  //    this step (decided Nov 2). `lines` is a new array made by map above,
  //    so pushing to it doesn't change anything that was passed in.
  if (crossedLowHealth(playerBefore, synced.player)) {
    lines.push({ text: describeLowHealth(synced.player), urgency: 'assertive' })
  }

  // 4. A finished fight is cleared, so the store goes back to exploring.
  const combat =
    getCombatStatus(update.state) === 'ongoing' ? update.state : null

  return { player: synced.player, enemies: synced.enemies, combat, lines }
}
