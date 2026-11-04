import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'

// Shown when the player falls. It doesn't take focus: CombatMenu moves focus
// to the map, and a screen reader hears the same sentence as the last line of
// the log ("Defeat. Game over. Reload the page to try again."). Moving focus
// here made VoiceOver drop the last batch of log lines (tested Nov 4).
export function GameOver() {
  const isDefeated = useStore(
    gameStore,
    (state) => state.player.currentHealth <= 0,
  )

  if (!isDefeated) return null

  return (
    <div className="game-over">
      <h2>Game over</h2>
      <p>You have fallen. Reload the page to try again.</p>
    </div>
  )
}
