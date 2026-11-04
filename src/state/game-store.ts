import { createStore } from 'zustand/vanilla'
import {
  movePlayer as computeMove,
  type Direction,
  type Grid,
  type Position,
} from '../game/movement'
import { loadRoom as loadRoomFromFiles } from '../rooms/load-room'
import type { Room } from '../rooms/room-schema'
import { describeMove } from '../game/narration'
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

type LogEntry = LogLine & { id: string }

export type GameState = {
  playerPosition: Position | null
  grid: Grid | null
  room: Room | null
  tiledMap: TiledMap | null
  enemies: StoreEnemy[]
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
    player: PLAYER,
    combat: null,
    loadRoom: (roomData, mapData) => {
      const { grid, room, tiledMap } = loadRoomFromFiles(roomData, mapData)
      const text = room.description
      const { log } = get()
      set({
        grid,
        playerPosition: room.playerStart,
        room,
        tiledMap,
        enemies: spawnEnemies(room.enemies),
        log: [...log, politeEntry(text)],
        combat: null, // loading a new room ends any fight in progress
      })
    },
    movePlayer: (direction) => {
      const { playerPosition, grid, enemies, log, player, combat } = get()
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
      const result = computeMove(
        playerPosition,
        direction,
        grid,
        enemyPositions,
      )
      const text = describeMove(result, direction)

      const moveEntry = politeEntry(text)

      // Only a step that actually happened can start a fight. A blocked move
      // means you're standing where you were.
      const adjacent = result.moved
        ? getAdjacentEnemies(result.newPosition, enemies)
        : []

      if (adjacent.length === 0) {
        set({ playerPosition: result.newPosition, log: [...log, moveEntry] })
        return
      }

      const step = beginCombat(player, enemies, adjacent, random)
      set({
        playerPosition: result.newPosition,
        player: step.player,
        enemies: step.enemies,
        combat: step.combat,
        log: [...log, moveEntry, ...withIds(step.lines)],
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
