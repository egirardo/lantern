import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { uiAsset } from './ui-asset'

// The Health panel, in the bottom row beside Inventory and Goal (decided
// Nov 13): "You: 8 / 12" as text, and a bar. Enemies' health joins it in a
// later PR, with its own log lines (rule 5), so it's a list from the start.
// - The text carries the information. The bar only repeats it for the eye,
//   so it's aria-hidden, and the text never relies on the bar's colour or
//   length (WCAG 1.4.1).
// - No live region: the log already announces every hit with its damage, and
//   low health has its own urgent line (the one assertive announcement).
//   Announcing the total here on every hit would flood the screen reader.
//   A screen reader user can read it at any time, under its heading.
export function HealthPanel() {
  // Two numbers, so this only re-renders when health changes.
  // Never below 0 on screen, even if the last hit was bigger than what was
  // left.
  const current = useStore(gameStore, (s) =>
    Math.max(0, s.player.currentHealth),
  )
  const max = useStore(gameStore, (s) => s.player.maxHealth)
  const percent = Math.round((current / max) * 100)

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
          <img className="icon" src={uiAsset('icon-health.png')} alt="" />
          <p className="health-text">
            You: {current} / {max}
          </p>
          <div className="health-bar" aria-hidden="true">
            {/* The width is the only inline style: it's data, not design. */}
            <span style={{ width: `${percent}%` }} />
          </div>
        </li>
      </ul>
    </section>
  )
}
