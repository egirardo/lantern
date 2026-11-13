// The goal of the game, step by step (decision 8): find the key in one room,
// then the great door it unlocks in another. A pure helper like the rest of
// src/game/ (rule 1), so the Goal panel only shows what this returns, and the
// rule can be tested without React.

import { itemDisplayName } from './items'

// The item type the great door needs. The same type the old crypt's final
// exit has in `"requires"`, and the mimic in `"carries"`.
export const GOAL_KEY = 'gold-key'

// The two steps of the goal. A name for each step, not only the text, so the
// Goal panel can show the key greyed out before it's found without checking
// the inventory itself (one place decides which step the player is on).
export type GoalStep = 'find-key' | 'find-door'

export type Goal = {
  step: GoalStep
  text: string
}

// The current step, from what the player carries. The inventory holds item
// types (decided Nov 6), so carrying the key is simply "the type is in it".
// The key's name comes from items.json through itemDisplayName, the same name
// the log uses ("You pick up a gold key."), so it's never written twice.
// `readonly string[]`: this function only reads the inventory, and the type
// says so (it also accepts the store's array as it is).
export function describeGoal(inventory: readonly string[]): Goal {
  const keyName = itemDisplayName(GOAL_KEY)
  if (inventory.includes(GOAL_KEY)) {
    return {
      step: 'find-door',
      text: `You have the ${keyName}. Find the great door.`,
    }
  }
  return { step: 'find-key', text: `Find the ${keyName}.` }
}
