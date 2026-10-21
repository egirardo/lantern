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

export type GameState = {
  playerPosition: Position | null
  grid: Grid | null
  room: Room | null
  tiledMap: TiledMap | null
  movePlayer: (direction: Direction) => void
  loadRoom: (roomData: unknown, mapData: unknown) => void
  log: { id: string; text: string }[]
}

// A factory, so every test can get its own fresh store instead of sharing one.
export function createGameStore() {
  return createStore<GameState>()((set, get) => ({
    // Nothing is loaded yet: null means "no room", unlike [] or { x: 0, y: 0 },
    // which would look like real data.
    log: [],
    playerPosition: null,
    grid: null,
    room: null,
    tiledMap: null,
    loadRoom: (roomData, mapData) => {
      const { grid, room, tiledMap } = loadRoomFromFiles(roomData, mapData)
      const text = room.description
      const { log } = get()
      set({
        grid,
        playerPosition: room.playerStart,
        room,
        tiledMap,
        log: [...log, { id: crypto.randomUUID(), text }],
      })
    },
    movePlayer: (direction) => {
      const { playerPosition, grid, log } = get()
      // No room loaded yet, so there's nowhere to move and nothing to narrate.
      // After this check, TypeScript knows both values aren't null (narrowing).
      if (playerPosition === null || grid === null) return
      const result = computeMove(playerPosition, direction, grid)
      const text = describeMove(result, direction)
      set({
        playerPosition: result.newPosition,
        log: [...log, { id: crypto.randomUUID(), text }],
      })
    },
  }))
}

// The one shared store the app uses. Phaser and React both import this.
export const gameStore = createGameStore()
