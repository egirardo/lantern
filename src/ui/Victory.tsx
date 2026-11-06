import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'

// Shown when the player goes through the final exit. Kept as small as
// GameOver on purpose: the real end screen with "Play again" comes later
// (decision 9). Like GameOver it doesn't take focus: a screen reader hears
// the same message as the last line of the log ("Victory! You climb out of
// the dungeon. Reload the page to play again."), and moving focus here made
// VoiceOver drop the last log lines for game over (tested Nov 4).
export function Victory() {
  const hasEscaped = useStore(gameStore, (state) => state.hasEscaped)

  if (!hasEscaped) return null

  return (
    <div className="victory">
      <h2>Victory</h2>
      <p>You climbed out of the dungeon. Reload the page to play again.</p>
    </div>
  )
}
