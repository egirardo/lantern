import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { describeGoal, goalHasKey, GOAL_KEY } from '../game/goal'
import { ItemSprite } from './ItemSprite'

// The goal panel: what to do next (decision 8). describeGoal in src/game/
// decides the step (four of them, Nov 13); this only shows it.
// - No key sprite in the first step ("Explore your surroundings."). The
//   player hasn't been told about the key yet, and the sprite is aria-hidden,
//   so showing it would tell a sighted player more than a screen reader user
//   (the same rule as the room descriptions: the canvas and the text tell
//   the same story). It appears once the locked door has asked for a key.
// - After that, the sprite is greyed out until the key is found, and in
//   colour (with the step in bold) once it's carried. That's decoration; the
//   sentence says the same in words.
// - No live region: the log already announces the locked door and finding
//   the key, and the goal changes at those moments. Like Inventory, it's a
//   named region a screen reader user can jump to and read.
// - A list with one item, so it can grow into a list of steps later; no
//   diamond in front (that marks the inventory's items).
export function Goal() {
  const inventory = useStore(gameStore, (s) => s.inventory)
  const foundLockedExit = useStore(gameStore, (s) => s.foundLockedExit)
  const goal = describeGoal(inventory, foundLockedExit)
  const showKey = goal.step !== 'explore'

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
        <li className={goalHasKey(goal.step) ? 'goal-done' : 'goal-todo'}>
          {/* `&&` renders the sprite only when showKey is true (React
              renders nothing for `false`). */}
          {showKey && <ItemSprite type={GOAL_KEY} />}
          <span>{goal.text}</span>
        </li>
      </ul>
    </section>
  )
}
