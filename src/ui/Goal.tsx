import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { describeGoal, GOAL_KEY } from '../game/goal'
import { ItemSprite } from './ItemSprite'

// The goal panel: what to do next (decision 8). describeGoal in src/game/
// decides the step; this only shows it.
// - The key's sprite is greyed out until the key is found. That's decoration
//   (aria-hidden); the sentence says the same in words.
// - No live region: the log already announces finding the key, and the goal
//   changes at that moment. Like Inventory, it's a named region a screen
//   reader user can jump to and read.
// - A list with one item, so it can grow into a list of steps later; no
//   diamond in front (that marks the inventory's items).
export function Goal() {
  const inventory = useStore(gameStore, (s) => s.inventory)
  const goal = describeGoal(inventory)

  return (
    <section aria-labelledby="goal-heading" className="panel-dark goal">
      <h2 id="goal-heading" className="banner">
        Goal
      </h2>
      {/* role="list" looks redundant, but Safari drops the list
          semantics of a list styled with list-style: none (.plain-list),
          and VoiceOver then doesn't say "list, n items". */}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul className="plain-list goal-list" role="list">
        <li className={goal.step === 'find-key' ? 'goal-todo' : 'goal-done'}>
          <ItemSprite type={GOAL_KEY} />
          <span>{goal.text}</span>
        </li>
      </ul>
    </section>
  )
}
