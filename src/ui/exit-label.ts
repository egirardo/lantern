import { findAdjacentExit } from '../game/exits'
import { exitButtonLabel } from '../game/narration'
import type { GameState } from '../state/game-store'

// The label, or null when there's no exit to use. A store selector, used by
// ActionsPanel to choose between the exit button and "Nothing to do here.". It
// returns a plain string (or null), so the panel only re-renders when the
// label itself changes, not on every store update. findAdjacentExit is the
// same rule takeExit uses, so the button is shown exactly when using the
// exit would find one.
export function selectExitLabel(state: GameState): string | null {
  if (state.combat !== null) return null
  if (state.playerPosition === null || state.room === null) return null
  const adjacent = findAdjacentExit(state.playerPosition, state.room.exits)
  if (adjacent === null) return null
  // findAdjacentExit returns the same exit object that is in room.exits,
  // so indexOf finds its index (the same idea as in exitRevealEntries).
  const isWayBack =
    state.room.exits.indexOf(adjacent.exit) === state.arrivalExitIndex
  return exitButtonLabel(isWayBack, adjacent.direction)
}
