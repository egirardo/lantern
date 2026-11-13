import { PLAYER } from '../game/player'
import {
  newGameContent,
  sameContent,
  saveContent,
  type SaveSource,
} from '../save/save-rules'
import { FIRST_ROOM_ID } from '../state/game-store'

// The label of the start screen's first button: "Continue" when there's a
// game in progress, "Start" otherwise (decision 9).
//
// It reads the store, not localStorage. startSaving (src/save/sync.ts) has
// already put the local save in the store before React renders, and a sync
// that loads a newer save from the account puts that in the store too. So
// "the store holds more than a new game" covers both cases in the brief:
// - a local save that isn't ended: restoreSave filled the store from it;
// - a save that sync just loaded: the same, a moment later.
// An ended save (or none) leaves the store as a new game, so it says Start.
// That's also the reason not to read the save slot here: the store is the one
// source of truth (rule 2), and this way no save code has to change.
//
// The comparison reuses the save rules: the content a save would hold now,
// against the content of a brand-new game. Steps inside the first room aren't
// part of a save, so walking around before reloading still says Start, which
// is right: there's no progress to continue.
export function startButtonLabel(state: SaveSource): 'Start' | 'Continue' {
  const fresh = newGameContent(FIRST_ROOM_ID, PLAYER.maxHealth)
  return sameContent(saveContent(state), fresh) ? 'Start' : 'Continue'
}
