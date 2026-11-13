import { gameStore } from '../state/game-store'
import { uiAsset } from './ui-asset'

// A button that does the same as Enter on the map: use the exit next to the
// player. It's there for players who look for actions as buttons (like the
// attack buttons), and so the action can be found by tabbing, not only by
// knowing the key.
// - Shown in the Actions panel only while the player stands next to an exit,
//   isn't in a fight and the game isn't over (the panel is gone then).
// - It never takes focus when it appears: it's simply in the Tab order after
//   the log.
// - Pressing it moves focus to the map (#53 VoiceOver pass, Nov 13). The
//   player arrives next to the exit back, so the button stays, now labelled
//   "Go back to the previous room". With focus left on it, Enter again went
//   straight back, and the arrow keys didn't move the player until they
//   tabbed to the map. The map is also where focus goes after a fight.
// - The label comes from exitButtonLabel (decision 11): "Go back to the
//   previous room" next to the exit the player arrived through, otherwise
//   "Use the exit to the north", the same direction the log uses when the
//   player walks into the exit. The label comes from selectExitLabel
//   (exit-label.ts), which the Actions panel reads.
export function ExitButton({ label }: { label: string }) {
  function handleExit() {
    gameStore.getState().takeExit()
    // The map is always on the game screen, so it's there to take focus.
    document.getElementById('phaser-game')?.focus()
  }

  return (
    <button type="button" className="btn exit-button" onClick={handleExit}>
      {/* The icon is decoration (alt=""): the label says what it does. */}
      <img className="icon" src={uiAsset('icon-exit.png')} alt="" />
      {label}
    </button>
  )
}
