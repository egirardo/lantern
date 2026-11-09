import type { GameState } from '../state/game-store'
import type { Settings } from '../state/settings'
import { SAVE_VERSION, type EndedGame, type Save } from './save-schema'

// The pure rules of saving: what goes in a save, when to save, and which of
// two copies wins. No localStorage, Supabase or store here, so every rule is
// unit tested with plain objects (like the rules in src/game/). sync.ts does
// the reading and writing.

// The parts of the store a save is built from. Pick<> takes only these
// fields from GameState, so a test can pass a small object instead of a
// whole store.
export type SaveSource = Pick<
  GameState,
  | 'currentRoomId'
  | 'enteredFrom'
  | 'player'
  | 'inventory'
  | 'takenItemIds'
  | 'defeatedEnemyIds'
>

// What a save holds without the bookkeeping (version and time). Two saves
// with the same content are the same progress, even if made at different
// times. Omit<> is the opposite of Pick<>: every field except these.
export type SaveContent = Omit<Save, 'version' | 'updatedAt'>

export function saveContent(state: SaveSource): SaveContent {
  return {
    currentRoomId: state.currentRoomId,
    enteredFrom: state.enteredFrom,
    health: state.player.currentHealth,
    inventory: state.inventory,
    takenItemIds: state.takenItemIds,
    defeatedEnemyIds: state.defeatedEnemyIds,
  }
}

// `now` is passed in instead of read here, so tests get a fixed time (the
// same idea as passing `random` to the combat code).
export function buildSave(state: SaveSource, now: Date): Save {
  return {
    version: SAVE_VERSION,
    ...saveContent(state),
    updatedAt: now.toISOString(),
  }
}

export function buildEnded(now: Date): EndedGame {
  return { version: SAVE_VERSION, ended: true, updatedAt: now.toISOString() }
}

// The fields of a save in a new game, before anything has happened. Used as
// the starting point to compare against, and to start a new game when a
// newer ended game arrives from another device.
export function newGameContent(firstRoomId: string, maxHealth: number) {
  return {
    currentRoomId: firstRoomId,
    enteredFrom: null,
    health: maxHealth,
    inventory: [],
    takenItemIds: [],
    defeatedEnemyIds: [],
  } satisfies SaveContent
}

// Compares field by field. Not JSON.stringify(a) === JSON.stringify(b),
// which would also depend on the order the keys were written in.
// For the lists, order matters too: they are in the order things happened.
export function sameContent(a: SaveContent, b: SaveContent): boolean {
  return (
    a.currentRoomId === b.currentRoomId &&
    a.enteredFrom === b.enteredFrom &&
    a.health === b.health &&
    sameList(a.inventory, b.inventory) &&
    sameList(a.takenItemIds, b.takenItemIds) &&
    sameList(a.defeatedEnemyIds, b.defeatedEnemyIds)
  )
}

export function sameSettings(a: Settings, b: Settings): boolean {
  return (
    a.reducedMotion === b.reducedMotion &&
    a.highContrast === b.highContrast &&
    a.textSize === b.textSize &&
    a.logVerbosity === b.logVerbosity
  )
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

// The parts of the store that decide whether this is a moment to save.
export type SaveMoment = Pick<
  GameState,
  'room' | 'currentRoomId' | 'combat' | 'player' | 'hasEscaped'
>

// What to do with the save after a change in the store:
// - 'end': the game is over (lost or won), so the slot says "ended" and the
//   next page load starts a new game.
// - 'wait': not a moment to save (a fight, or between rooms), so nothing is
//   written. The next change after it decides again.
// - 'save': save, if the content has changed (the caller checks that).
export type SaveAction = 'save' | 'wait' | 'end'

export function saveAction(state: SaveMoment): SaveAction {
  // Checked first: the player falls in a fight, so combat is already null
  // then, and 'save' must not win.
  if (state.player.currentHealth <= 0 || state.hasEscaped) return 'end'
  // A save in the middle of a fight couldn't be loaded back into that fight.
  if (state.combat !== null) return 'wait'
  // No room loaded yet (start-up), or an exit was taken and the next room is
  // still loading. In the gap, currentRoomId is already the next room but
  // enteredFrom still names the room before, so a save would be wrong.
  // loadRoom fixes both in one set(), and the save happens right after.
  if (state.room === null || state.room.id !== state.currentRoomId) {
    return 'wait'
  }
  return 'save'
}

// When to also send the save to Supabase (when signed in). Not on every
// save: a pickup only goes to localStorage, and reaches Supabase at the next
// of these moments, or on pagehide.
export function shouldPush(prev: SaveMoment, next: SaveMoment): boolean {
  // A room finished loading (a different room than before).
  const roomChanged = next.room !== null && next.room.id !== prev.room?.id
  // A fight ended: won, or lost (the player falls and combat becomes null).
  const fightEnded = prev.combat !== null && next.combat === null
  // Victory isn't a fight or a room change, but it ends the game.
  const escaped = !prev.hasEscaped && next.hasEscaped
  return roomChanged || fightEnded || escaped
}

// Which copy wins, by updatedAt (rule 8: the newest wins). null means that
// side has nothing. 'same' means there's nothing to copy either way.
// Date.parse, not string comparison: Supabase and toISOString() can write
// the same moment in different ways (see remote-store.ts).
export type Winner = 'local' | 'remote' | 'same'

export function chooseNewest(
  localUpdatedAt: string | null,
  remoteUpdatedAt: string | null,
): Winner {
  if (localUpdatedAt === null && remoteUpdatedAt === null) return 'same'
  if (remoteUpdatedAt === null) return 'local'
  if (localUpdatedAt === null) return 'remote'
  const local = Date.parse(localUpdatedAt)
  const remote = Date.parse(remoteUpdatedAt)
  if (local > remote) return 'local'
  if (remote > local) return 'remote'
  return 'same'
}
