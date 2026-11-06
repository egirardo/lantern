import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { findAdjacentExit } from '../game/exits'

// A button that does the same as Enter on the map: use the exit next to the
// player. It's there for players who look for actions as buttons (like the
// combat menu), and so the action can be found by tabbing, not only by
// knowing the key.
// - Shown only while the player stands next to an exit and isn't in a fight.
// - It never takes focus: it's simply in the Tab order after the map.
// - The label names the direction ("Use the exit to the north"), the same
//   direction the log uses when the player walks into the exit.
export function ExitButton() {
  // The selector returns a plain string (or null), so the component only
  // re-renders when the direction itself changes, not on every store update.
  // findAdjacentExit is the same rule takeExit uses, so the button is shown
  // exactly when using the exit would find one.
  const direction = useStore(gameStore, (state) => {
    if (state.combat !== null) return null
    if (state.playerPosition === null || state.room === null) return null
    return (
      findAdjacentExit(state.playerPosition, state.room.exits)?.direction ??
      null
    )
  })

  if (direction === null) return null

  return (
    <button
      type="button"
      className="exit-button"
      onClick={() => gameStore.getState().takeExit()}
    >
      Use the exit to the {direction}
    </button>
  )
}
