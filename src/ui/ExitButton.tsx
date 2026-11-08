import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { findAdjacentExit } from '../game/exits'
import { exitButtonLabel } from '../game/narration'

// A button that does the same as Enter on the map: use the exit next to the
// player. It's there for players who look for actions as buttons (like the
// combat menu), and so the action can be found by tabbing, not only by
// knowing the key.
// - Shown only while the player stands next to an exit and isn't in a fight.
// - It never takes focus: it's simply in the Tab order after the map.
// - The label comes from exitButtonLabel (decision 11): "Go back to the
//   previous room" next to the exit the player arrived through, otherwise
//   "Use the exit to the north", the same direction the log uses when the
//   player walks into the exit.
export function ExitButton() {
  // The selector returns a plain string (or null), so the component only
  // re-renders when the label itself changes, not on every store update.
  // findAdjacentExit is the same rule takeExit uses, so the button is shown
  // exactly when using the exit would find one.
  const label = useStore(gameStore, (state) => {
    if (state.combat !== null) return null
    if (state.playerPosition === null || state.room === null) return null
    const adjacent = findAdjacentExit(state.playerPosition, state.room.exits)
    if (adjacent === null) return null
    // findAdjacentExit returns the same exit object that is in room.exits,
    // so indexOf finds its index (the same idea as in exitRevealEntries).
    const isWayBack =
      state.room.exits.indexOf(adjacent.exit) === state.arrivalExitIndex
    return exitButtonLabel(isWayBack, adjacent.direction)
  })

  if (label === null) return null

  return (
    <button
      type="button"
      className="exit-button"
      onClick={() => gameStore.getState().takeExit()}
    >
      {label}
    </button>
  )
}
