import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { uiAsset } from './ui-asset'

// The player's health under the map: "Health 8 / 12" as text, and a bar.
// - The text carries the information. The bar only repeats it for the eye,
//   so it's aria-hidden, and the text never relies on the bar's colour or
//   length (WCAG 1.4.1).
// - No live region: the log already announces every change in health ("You
//   have 8 of 12 health left."). Announcing it here too would say it twice.
export function HealthDisplay() {
  // Two numbers, so this only re-renders when health changes.
  const current = useStore(gameStore, (s) => s.player.currentHealth)
  const max = useStore(gameStore, (s) => s.player.maxHealth)
  // Below 0 can't be drawn, so the bar stops at empty.
  const percent = Math.max(0, Math.round((current / max) * 100))

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
