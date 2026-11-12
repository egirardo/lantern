import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { uiAsset } from './ui-asset'

// The player's health under the map: "Health 8 / 12" as text, and a bar.
// - The text carries the information. The bar only repeats it for the eye,
//   so it's aria-hidden, and the text never relies on the bar's colour or
//   length (WCAG 1.4.1).
// - No live region: the log already announces every hit with its damage, and
//   low health has its own urgent line (the one assertive announcement).
//   Announcing the total here on every hit would flood the screen reader.
//   A screen reader user can read it at any time, right after the map.
export function HealthDisplay() {
  // Two numbers, so this only re-renders when health changes.
  // Never below 0 on screen, even if the last hit was bigger than what was
  // left.
  const current = useStore(gameStore, (s) =>
    Math.max(0, s.player.currentHealth),
  )
  const max = useStore(gameStore, (s) => s.player.maxHealth)
  const percent = Math.round((current / max) * 100)

  return (
    <div className="health">
      <img className="icon" src={uiAsset('icon-health.png')} alt="" />
      <p className="health-text">
        Health {current} / {max}
      </p>
      <div className="health-bar" aria-hidden="true">
        {/* The width is the only inline style: it's data, not design. */}
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
