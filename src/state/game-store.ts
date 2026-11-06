import { createStore } from 'zustand/vanilla'
import {
  movePlayer as computeMove,
  type Direction,
  type Grid,
  type Position,
} from '../game/movement'
import { loadRoom as loadRoomFromFiles } from '../rooms/load-room'
import type { Room } from '../rooms/room-schema'
import { describeMove, describeReveal } from '../game/narration'
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

type LogEntry = LogLine & { id: string }

export type GameState = {
  playerPosition: Position | null
  grid: Grid | null
  room: Room | null
  tiledMap: TiledMap | null
  enemies: StoreEnemy[]
  // Ids of the enemies the player has already seen in this room, so the
  // reveal can say "a skeleton" the first time and "the skeleton" after.
  seenEnemyIds: string[]
  movePlayer: (direction: Direction) => void
  loadRoom: (roomData: unknown, mapData: unknown) => void
  log: LogEntry[]
  player: Combatant
  combat: CombatState | null
  playerAttack: (targetId: string) => void
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
    enemies: [],
    seenEnemyIds: [],
    player: PLAYER,
    combat: null,
    loadRoom: (roomData, mapData) => {
      const { grid, room, tiledMap } = loadRoomFromFiles(roomData, mapData)
      const text = room.description
      const { log } = get()
      // nothing was lit before the room existed
      const litBefore: Position[] = []
      const litAfter = getVisibleTiles(grid, room.playerStart, LANTERN_RADIUS)
      const enemies = spawnEnemies(room.enemies)
      // A new room starts with nobody seen ([]), so ids from the last room
      // (which can repeat, e.g. 'e1') don't count.
      const reveal = revealEntries(
        getNewlyLit(litBefore, litAfter, enemies),
        room.playerStart,
        [],
      )
      set({
        grid,
        playerPosition: room.playerStart,
        room,
        tiledMap,
        enemies,
        seenEnemyIds: reveal.seenEnemyIds,
        log: [...log, politeEntry(text), ...reveal.entries],
        combat: null, // loading a new room ends any fight in progress
      })
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

      // Game over: the player can't act any more.
      if (player.currentHealth <= 0) {
        set({
          log: [...log, politeEntry('You have fallen in battle.')],
        })
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
