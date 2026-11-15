// The goal of the game, step by step (decision 8): find the key in one room,
// then the great door it unlocks in another. A pure helper like the rest of
// src/game/ (rule 1), so the Goal panel only shows what this returns, and the
// rule can be tested without React.

import { itemDisplayName } from './items'

// The item type the great door needs. The same type the old crypt's final
// exit has in `"requires"`, and the mimic in `"carries"`.
export const GOAL_KEY = 'gold-key'

// The four steps of the goal (Nov 13). Two things decide the step: does the
// player carry the key, and have they found the locked great door (tried it
// and been told it's locked)? Two yes/no questions give four steps:
//
//                     door not found yet       door found (tried it)
//   no key            'explore'                'find-key'
//   key               'find-door'              'return-to-door'
//
// A name for each step, not only the text, so the Goal panel can decide how
// to show the key sprite without checking the inventory itself (one place
// decides which step the player is on).
export type GoalStep = 'explore' | 'find-key' | 'find-door' | 'return-to-door'

export type Goal = {
  step: GoalStep
  text: string
}

// The current step, from what the player carries and whether they have found
// the locked great door (`foundLockedExit` in the store).
// - The inventory holds item types (decided Nov 6), so carrying the key is
//   simply "the type is in it".
// - The key's name comes from items.json through itemDisplayName, the same
//   name the log uses ("You pick up a gold key."), so it's never written
//   twice.
// - Before the door is found, the goal doesn't name the key: the player
//   hasn't been told yet that a key is needed, so "Find the gold key." would
//   come out of nowhere. "Explore your surroundings." is true at that point.
// `readonly string[]`: this function only reads the inventory, and the type
// says so (it also accepts the store's array as it is).
export function describeGoal(
  inventory: readonly string[],
  foundLockedExit: boolean,
): Goal {
  const keyName = itemDisplayName(GOAL_KEY)
  const hasKey = inventory.includes(GOAL_KEY)

  if (hasKey && foundLockedExit) {
    return {
      step: 'return-to-door',
      text: `You have the ${keyName}. Return to the great door.`,
    }
  }
  if (hasKey) {
    return {
      step: 'find-door',
      text: `You have the ${keyName}. Find the great door.`,
    }
  }
  if (foundLockedExit) {
    return { step: 'find-key', text: `Find the ${keyName}.` }
  }
  return { step: 'explore', text: 'Explore your surroundings.' }
}

// True for the steps where the player carries the key. The Goal panel uses
// it to show the key sprite in colour (and the step in bold) instead of
// greyed out. Here, next to the steps, so adding a step means updating one
// file.
export function goalHasKey(step: GoalStep): boolean {
  return step === 'find-door' || step === 'return-to-door'
}
