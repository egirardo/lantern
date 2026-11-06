import { createStore } from 'zustand/vanilla'
import {
  movePlayer as computeMove,
  type Direction,
  type Grid,
  type Position,
} from '../game/movement'
import { loadRoom as loadRoomFromFiles } from '../rooms/load-room'
import type { Room } from '../rooms/room-schema'
import {
  describeAlreadyEscaped,
  describeMove,
  describeReveal,
} from '../game/narration'
import type { TiledMap } from '../rooms/tiled-schema'
import { spawnEnemies, type StoreEnemy } from '../game/spawn-enemies'
import {
  type LogLine,
  playerAttackStep,
  beginCombat,
} from '../game/combat-flow'
import type { Combatant, CombatState } from '../game/combat'
import { getAdjacentEnemies } from '../game/adjacency'
import { PLAYER } from '../game/player'
import {
  getNewlyLit,
  getVisibleTiles,
  LANTERN_RADIUS,
} from '../game/visibility'
import { directionFrom } from '../game/compass'
import { exitStep, findArrivalPosition } from '../game/exits'

type LogEntry = LogLine & { id: string }

// The room a new game starts in. RoomLoader loads whatever currentRoomId
// says, so this is where the first fetch comes from.
export const FIRST_ROOM_ID = 'entrance-hall'

// The line when the player tries to act after falling. Used by movePlayer
// and takeExit, so both say the same thing.
const FALLEN_TEXT = 'You have fallen in battle.'

export type GameState = {
  playerPosition: Position | null
  grid: Grid | null
  room: Room | null
  tiledMap: TiledMap | null
  // The id of the room the player is in, or is on the way to. RoomLoader
  // watches it: when an exit changes it, RoomLoader fetches that room's files
  // and calls loadRoom. Until loadRoom has run, `room` is still the old room,
  // so room.id !== currentRoomId means "the next room is loading".
  currentRoomId: string
  // The room the player just left through an exit, so loadRoom can place
  // them at the doorway that leads back there. null at the start of a game,
  // which places the player at playerStart. loadRoom sets it back to null.
  arrivingFrom: string | null
  // The item types the player carries, e.g. ['rusty-key']. Empty for now:
  // picking items up comes with Agent E. A locked exit checks this list.
  inventory: string[]
  // True once the player has gone through the final exit and won. Like
  // game over (health 0), nothing can be done after that.
  hasEscaped: boolean
  // The exit lines ("You go through the exit…", "You recover to full
  // health…") waiting for the next room to load. takeExit puts them here
  // instead of in the log, and loadRoom logs them before the description, in
  // the same set(). That makes a room change one log batch: LiveAnnouncer
  // replaces its batch on every log update, so with two updates a few ms
  // apart, VoiceOver skipped the exit lines and only read the description
  // (found in the VoiceOver playtest, Nov 6). If the next room fails to load,
  // these lines are never shown; that's accepted, because RoomLoader's error
  // message takes over then.
  pendingExitLines: LogEntry[]
  enemies: StoreEnemy[]
  // Ids of the enemies the player has already seen in this room, so the
  // reveal can say "a skeleton" the first time and "the skeleton" after.
  seenEnemyIds: string[]
  movePlayer: (direction: Direction) => void
  loadRoom: (roomData: unknown, mapData: unknown) => void
  // Use the exit next to the player (Enter on the map, or the exit button).
  takeExit: () => void
  log: LogEntry[]
  player: Combatant
  combat: CombatState | null
  playerAttack: (targetId: string) => void
}

// True between an exit and the next room being loaded. Moving and using
// exits are ignored then: the old room is still on screen, but the player
// has already left it. It's usually a few milliseconds, so a key press in
// that gap is ignored without a log line (the "Loading the room…" status
// in RoomLoader covers a slow connection).
function isChangingRoom(state: GameState): boolean {
  return state.room !== null && state.room.id !== state.currentRoomId
}

function withIds(log: LogLine[]): LogEntry[] {
  return log.map((line) => ({ ...line, id: crypto.randomUUID() }))
}

function politeEntry(text: string): LogEntry {
  return { id: crypto.randomUUID(), text, urgency: 'polite' }
}

// One log entry per enemy that just came into the light (rule 5), measured
// from where the player stands. Also returns the updated list of seen ids,
// because the store saves both in the same set(). Nothing here changes the
// inputs: map() and the spread build new arrays.
function revealEntries(
  newlyLit: StoreEnemy[],
  from: Position,
  seenEnemyIds: string[],
): { entries: LogEntry[]; seenEnemyIds: string[] } {
  const entries = newlyLit.map((enemy) =>
    politeEntry(
      describeReveal(
        enemy,
        directionFrom(from, enemy.position),
        seenEnemyIds.includes(enemy.id),
      ),
    ),
  )
  // Add only ids that aren't in the list yet, so an enemy is never listed twice.
  const newIds = newlyLit
    .map((enemy) => enemy.id)
    .filter((id) => !seenEnemyIds.includes(id))
  return { entries, seenEnemyIds: [...seenEnemyIds, ...newIds] }
}

// A factory, so every test can get its own fresh store instead of sharing one.
export function createGameStore(random: () => number = Math.random) {
  return createStore<GameState>()((set, get) => ({
    // Nothing is loaded yet: null means "no room", unlike [] or { x: 0, y: 0 },
    // which would look like real data.
    log: [],
    playerPosition: null,
    grid: null,
    room: null,
    tiledMap: null,
    currentRoomId: FIRST_ROOM_ID,
    arrivingFrom: null,
    inventory: [],
    hasEscaped: false,
    pendingExitLines: [],
    enemies: [],
    seenEnemyIds: [],
    player: PLAYER,
    combat: null,
    loadRoom: (roomData, mapData) => {
      const { grid, room, tiledMap } = loadRoomFromFiles(roomData, mapData)
      const text = room.description
      const { log, arrivingFrom, pendingExitLines } = get()
      const enemies = spawnEnemies(room.enemies)
      // At the doorway that leads back where the player came from, or at
      // playerStart in a new game (arrivingFrom is null). Enemy tiles are
      // passed so the player is never placed on top of an enemy.
      const start = findArrivalPosition(
        grid,
        room.exits,
        room.playerStart,
        arrivingFrom,
        enemies.map((enemy) => enemy.position),
      )
      // nothing was lit before the room existed
      const litBefore: Position[] = []
      const litAfter = getVisibleTiles(grid, start, LANTERN_RADIUS)
      // A new room starts with nobody seen ([]), so ids from the last room
      // (which can repeat, e.g. 'e1') don't count.
      const reveal = revealEntries(
        getNewlyLit(litBefore, litAfter, enemies),
        start,
        [],
      )
      set({
        grid,
        playerPosition: start,
        room,
        tiledMap,
        // The loaded room is now the current one, and the arrival is done.
        // Setting currentRoomId here too keeps the two in step when loadRoom
        // is called directly (as the tests do).
        currentRoomId: room.id,
        arrivingFrom: null,
        enemies,
        seenEnemyIds: reveal.seenEnemyIds,
        // One batch for the whole room change: the exit lines (empty at the
        // start of a game), then the description, then the reveals.
        log: [
          ...log,
          ...pendingExitLines,
          politeEntry(text),
          ...reveal.entries,
        ],
        pendingExitLines: [],
        combat: null, // loading a new room ends any fight in progress
      })
    },
    takeExit: () => {
      const state = get()
      const { playerPosition, room, combat, inventory, player, log } = state
      // No room loaded yet, or the next room is still loading: nothing to use.
      if (playerPosition === null || room === null) return
      if (isChangingRoom(state)) return

      // The game is over, lost or won: the player can't act any more.
      if (player.currentHealth <= 0) {
        set({ log: [...log, politeEntry(FALLEN_TEXT)] })
        return
      }
      if (state.hasEscaped) {
        set({ log: [...log, politeEntry(describeAlreadyEscaped())] })
        return
      }

      // exitStep decides everything (fight, no exit, lock, final exit) and
      // the store only saves the result, like the combat steps.
      const step = exitStep({
        position: playerPosition,
        exits: room.exits,
        inCombat: combat !== null,
        inventory,
        player,
      })
      const lines = withIds(step.lines)

      switch (step.kind) {
        case 'stay':
          set({ log: [...log, ...lines] })
          return
        case 'escape':
          set({ hasEscaped: true, log: [...log, ...lines] })
          return
        case 'leave':
          // Changing currentRoomId is what makes RoomLoader fetch the next
          // room. The heal happens here, not in loadRoom, so loading a room
          // in another way (e.g. a save later) doesn't heal (decided Nov 3).
          // The lines are not logged yet: loadRoom logs them together with
          // the new room's description (see pendingExitLines).
          set({
            player: step.player,
            currentRoomId: step.to,
            arrivingFrom: room.id,
            pendingExitLines: lines,
          })
          return
      }
    },
    movePlayer: (direction) => {
      const {
        playerPosition,
        grid,
        room,
        enemies,
        seenEnemyIds,
        log,
        player,
        combat,
      } = get()
      // No room loaded yet, so there's nowhere to move and nothing to narrate.
      // After this check, TypeScript knows both values aren't null (narrowing).
      if (playerPosition === null || grid === null) return

      // The player has gone through an exit and the next room is loading.
      if (isChangingRoom(get())) return

      // Game over: the player can't act any more.
      if (player.currentHealth <= 0) {
        set({
          log: [...log, politeEntry(FALLEN_TEXT)],
        })
        return
      }

      // Won: the player has left the dungeon, so there's nothing to move in.
      if (get().hasEscaped) {
        set({ log: [...log, politeEntry(describeAlreadyEscaped())] })
        return
      }

      // In a fight: moving is not allowed (fleeing is a later Could).
      if (combat) {
        set({
          log: [...log, politeEntry('You are in a fight and cannot move.')],
        })
        return
      }

      // Enemies are solid, so movement needs to know which tiles they stand on.
      const enemyPositions = enemies.map((enemy) => enemy.position)
      // Every tile of every exit, so walking into one says how to use it.
      // flatMap turns the list of exits (each with a list of tiles) into one
      // flat list of tiles. `?? []` covers the type: room can't really be
      // null when grid isn't, but TypeScript doesn't know that.
      const exitTiles = room?.exits.flatMap((exit) => exit.tiles) ?? []
      const result = computeMove(
        playerPosition,
        direction,
        grid,
        enemyPositions,
        exitTiles,
      )
      const text = describeMove(result, direction)

      const moveEntry = politeEntry(text)

      // What the lantern lights before and after the step. A blocked move has
      // the same position in both, so it reveals nothing without a special case.
      const litBefore = getVisibleTiles(grid, playerPosition, LANTERN_RADIUS)
      const litAfter = getVisibleTiles(grid, result.newPosition, LANTERN_RADIUS)

      // The reveal lines are added to the log together with the step line in
      // the single set() below.
      const reveal = revealEntries(
        getNewlyLit(litBefore, litAfter, enemies),
        result.newPosition,
        seenEnemyIds,
      )

      // Only a step that actually happened can start a fight. A blocked move
      // means you're standing where you were.
      const adjacent = result.moved
        ? getAdjacentEnemies(result.newPosition, enemies)
        : []

      if (adjacent.length === 0) {
        set({
          playerPosition: result.newPosition,
          seenEnemyIds: reveal.seenEnemyIds,
          log: [...log, moveEntry, ...reveal.entries],
        })
        return
      }

      const step = beginCombat(player, enemies, adjacent, random)
      set({
        playerPosition: result.newPosition,
        player: step.player,
        enemies: step.enemies,
        combat: step.combat,
        seenEnemyIds: reveal.seenEnemyIds,
        // Step, then reveal, then the fight start (decided Nov 4).
        log: [...log, moveEntry, ...reveal.entries, ...withIds(step.lines)],
      })
    },

    playerAttack: (targetId) => {
      const { combat, enemies, log } = get()
      // No game-over check needed: when the player falls, finishStep sets combat
      // to null, so the check below already covers it.
      if (!combat) return
      const step = playerAttackStep(combat, enemies, targetId, random)
      set({
        player: step.player,
        enemies: step.enemies,
        combat: step.combat,
        log: [...log, ...withIds(step.lines)],
      })
    },
  }))
}

// The one shared store the app uses. Phaser and React both import this.
export const gameStore = createGameStore()
