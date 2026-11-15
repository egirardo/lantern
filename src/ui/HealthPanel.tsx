import { useStore } from 'zustand'
import { getEnemyHealthRows } from '../game/narration'
import { gameStore } from '../state/game-store'

// The Health panel, in the bottom row beside Inventory and Goal (decided
// Nov 13): "You: 8 / 12" as text, and a bar. During a fight, one row per
// enemy still standing joins it under the player's row (decided Nov 15):
// "Demon: 6 / 10". The log says the same numbers after each hit (rule 5),
// so the panel never shows something the log doesn't.
// - The text carries the information. The bar only repeats it for the eye,
//   so it's aria-hidden, and the text never relies on the bar's colour or
//   length (WCAG 1.4.1).
// - No live region: the log already announces every hit and the health left
//   after it, and low health has its own urgent line (the one assertive
//   announcement). Announcing here too would say everything twice.
//   A screen reader user can read it at any time, under its heading.
export function HealthPanel() {
  // Two numbers, so this only re-renders when health changes.
  // Never below 0 on screen, even if the last hit was bigger than what was
  // left.
  const current = useStore(gameStore, (s) =>
    Math.max(0, s.player.currentHealth),
  )
  const max = useStore(gameStore, (s) => s.player.maxHealth)
  // The fight itself, straight from the store (rule 2: no copy here). The
  // selector returns the store's own object, so it only changes when the
  // fight does. The rows are worked out below, during render: a selector
  // that built a new array would return a "new" value on every check, and
  // React would re-render forever.
  const combat = useStore(gameStore, (s) => s.combat)
  const enemyRows = getEnemyHealthRows(combat)

  return (
    <section aria-labelledby="health-heading" className="panel-dark health">
      <h2 id="health-heading" className="banner">
        Health
      </h2>
      {/* role="list" looks redundant, but Safari drops the list
          semantics of a list styled with list-style: none (.plain-list),
          and VoiceOver then doesn't say "list, n items". */}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul className="plain-list health-list" role="list">
        <li>
          <p className="health-text">
            You: {current} / {max}
          </p>
          <HealthBar current={current} max={max} />
        </li>
        {/* One row per enemy in the fight. `key` is the enemy's id, so React
            keeps each row when the others change or one is defeated. */}
        {enemyRows.map((row) => (
          <li key={row.id}>
            <p className="health-text">
              {row.name}: {row.currentHealth} / {row.maxHealth}
            </p>
            <HealthBar current={row.currentHealth} max={row.maxHealth} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// The bar under a row's text, the same for the player and the enemies.
// aria-hidden: it only repeats the text for the eye.
function HealthBar({ current, max }: { current: number; max: number }) {
  const percent = Math.round((current / max) * 100)
  return (
    <div className="health-bar" aria-hidden="true">
      {/* The width is the only inline style: it's data, not design. */}
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}
