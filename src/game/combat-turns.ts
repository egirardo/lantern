import {
  PLAYER_ID,
  type Combatant,
  type CombatEntry,
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
