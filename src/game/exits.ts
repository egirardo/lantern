// Pure helpers for exits: finding the exit next to the player, deciding what
// happens when the player uses it, and where the player arrives in the next
// room. The store calls them and saves the result (like combat-flow.ts), so
// all the rules can be tested without a store, React or Phaser (rule 1).

// `import type` is erased when the code is built, so src/game/ doesn't load
// anything from src/rooms/ at runtime. It only borrows the Exit type, which
// Zod makes from the room schema, so the two can never drift apart.
import type { Exit } from '../rooms/room-schema'
import type { Combatant } from './combat'
import type { LogLine } from './combat-flow'
import { items } from './item-schema'
import {
  DIRECTION_OFFSETS,
  DIRECTIONS,
  samePosition,
  type Direction,
  type Grid,
  type Position,
} from './movement'
import {
  describeEscape,
  describeExitInFight,
  describeFullHealth,
  describeGoThrough,
  describeLocked,
  describeNoExitNearby,
  describeUnlock,
} from './narration'
import { healFully } from './recovery'

// An exit next to the player, and which way it is from them.
export type AdjacentExit = { exit: Exit; direction: Direction }

// The tile one step from `position` in `direction`.
function step(position: Position, direction: Direction): Position {
  const offset = DIRECTION_OFFSETS[direction]
  return { x: position.x + offset.x, y: position.y + offset.y }
}

// The exit the player can use from `position`: one with a tile straight
// north, south, east or west of the player (not diagonal, the same rule as
// stepping into it). null if there is none.
// If two exits touch the player (e.g. in a corner), the first one in the
// room file wins, so the answer is always the same for the same room.
export function findAdjacentExit(
  position: Position,
  exits: Exit[],
): AdjacentExit | null {
  for (const exit of exits) {
    for (const direction of DIRECTIONS) {
      const neighbour = step(position, direction)
      if (exit.tiles.some((tile) => samePosition(tile, neighbour))) {
        return { exit, direction }
      }
    }
  }
  return null
}

// The exit the player has just stepped next to: next to it after the step,
// but not before. The store logs "You are next to the exit… Press Enter to
// use it." for it, because the exit button appears silently (it doesn't take
// focus), so without a line a screen reader user wouldn't know they can use
// the exit now (decided Nov 8).
// - "Not before" means not next to *that* exit, so walking along a two-tile
//   door doesn't repeat the line, but stepping from one exit to another does.
//   findAdjacentExit with a list of just that one exit answers "is the player
//   next to this exit?", so no second adjacency rule is needed.
// - A blocked move has the same position before and after, so it gives null
//   without a special case.
export function findNewlyAdjacentExit(
  before: Position,
  after: Position,
  exits: Exit[],
): AdjacentExit | null {
  const adjacent = findAdjacentExit(after, exits)
  if (adjacent === null) return null
  const wasAlreadyNextToIt = findAdjacentExit(before, [adjacent.exit]) !== null
  return wasAlreadyNextToIt ? null : adjacent
}

// Which exit in this room leads back to the room the player just left: its
// index in `exits`, or null at the start of a game (fromRoomId is null) or
// when no exit leads back. An index, not the exit itself, because the store
// keeps it as `arrivalExitIndex` next to `seenExitIndexes` (exits have no id).
// findArrivalPosition uses it too, so the player arrives next to the same
// exit that the log calls "the way back".
// - `'to' in exit` checks the exit's shape: the final exit has no `to`, so it
//   never matches. After the check, TypeScript knows exit.to exists
//   (narrowing with `in`).
// - findIndex returns the first match, or -1 when there is none. -1 becomes
//   null, so callers can't use it as an index by mistake.
export function findExitBackIndex(
  exits: Exit[],
  fromRoomId: string | null,
): number | null {
  if (fromRoomId === null) return null
  const index = exits.findIndex(
    (exit) => 'to' in exit && exit.to === fromRoomId,
  )
  return index === -1 ? null : index
}

// Where the player stands when they enter a room (decided Nov 2: at the
// doorway, not at playerStart).
// - `fromRoomId` is the room the player just left, or null at the start of a
//   new game. null gives playerStart, the only time it's used.
// - Otherwise: find the exit in this room that leads back to `fromRoomId`,
//   and stand on the first floor tile next to it (its tiles in order, and
//   for each tile north, south, east, west). `blocked` are tiles the player
//   can't stand on, i.e. where enemies are.
// - Fallback: if there's no exit back, or every tile next to it is a wall or
//   has an enemy on it, the player starts at playerStart. A one-way door is
//   allowed this way, and the game never gets stuck.
export function findArrivalPosition(
  grid: Grid,
  exits: Exit[],
  playerStart: Position,
  fromRoomId: string | null,
  blocked: Position[] = [],
): Position {
  // The same lookup the store uses to name the way back, so where the player
  // arrives and which exit the log calls "the way back" always agree.
  // null at the start of a game, or when this room has no exit back.
  const index = findExitBackIndex(exits, fromRoomId)
  // exits[index] can't really be undefined, but noUncheckedIndexedAccess
  // (tsconfig) makes TypeScript say it might be, so one check covers both.
  const exitBack = index === null ? undefined : exits[index]
  if (!exitBack) return playerStart

  for (const tile of exitBack.tiles) {
    for (const direction of DIRECTIONS) {
      const neighbour = step(tile, direction)
      const isFloor = grid[neighbour.y]?.[neighbour.x] === 'floor'
      const isFree = !blocked.some((position) =>
        samePosition(position, neighbour),
      )
      if (isFloor && isFree) return neighbour
    }
  }
  return playerStart
}

// What the store needs to know to use an exit.
export type ExitStepInput = {
  position: Position
  exits: Exit[]
  inCombat: boolean
  // The item types the player carries, e.g. ['gold-key'].
  inventory: string[]
  player: Combatant
}

// What happens when the player uses an exit. One of three outcomes:
// - 'stay': nothing changes except the log (in a fight, no exit, locked).
// - 'leave': go to room `to`, with the player healed to full health.
// - 'escape': the final exit. The game is won.
export type ExitStep =
  | { kind: 'stay'; lines: LogLine[] }
  | { kind: 'leave'; to: string; player: Combatant; lines: LogLine[] }
  | { kind: 'escape'; lines: LogLine[] }

// Every exit line is a normal event, so all of them are polite.
function polite(text: string): LogLine {
  return { text, urgency: 'polite' }
}

// The player uses an exit (Enter on the map, or the exit button). The checks
// run in this order, and the first one that stops the player wins:
// 1. In a fight: can't leave.
// 2. No exit next to the player.
// 3. The exit is locked and the player doesn't carry its key.
// Otherwise the exit is used. A locked exit says it unlocks first (the key is
// used automatically, decision 8). Then either the game is won (final exit)
// or the player goes through to the next room and is healed to full.
export function exitStep(input: ExitStepInput): ExitStep {
  const { position, exits, inCombat, inventory, player } = input

  if (inCombat) {
    return { kind: 'stay', lines: [polite(describeExitInFight())] }
  }

  const adjacent = findAdjacentExit(position, exits)
  if (!adjacent) {
    return { kind: 'stay', lines: [polite(describeNoExitNearby())] }
  }
  const { exit, direction } = adjacent

  const lines: LogLine[] = []
  if (exit.requires !== undefined) {
    if (!inventory.includes(exit.requires)) {
      return { kind: 'stay', lines: [polite(describeLocked())] }
    }
    lines.push(polite(describeUnlock(itemName(exit.requires))))
  }

  // `'final' in exit` narrows the union, like `'to' in exit` above.
  if ('final' in exit) {
    return { kind: 'escape', lines: [...lines, polite(describeEscape())] }
  }

  const healed = healFully(player)
  return {
    kind: 'leave',
    to: exit.to,
    player: healed,
    lines: [
      ...lines,
      polite(describeGoThrough(direction)),
      polite(describeFullHealth(healed)),
    ],
  }
}

// The display name of an item type, e.g. 'gold-key' -> 'gold key'. The
// room schema only accepts types that are in items.json, so a missing one
// means a bug, not bad room data.
function itemName(type: string): string {
  const item = items[type]
  if (!item) {
    throw new Error(`Unknown item type ${type}`)
  }
  return item.displayName
}
