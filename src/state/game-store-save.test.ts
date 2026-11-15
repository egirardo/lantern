import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import { PLAYER } from '../game/player'
import { validMap, validRoom } from '../rooms/testing-map'
import type { Room } from '../rooms/room-schema'
import type { SaveContent } from '../save/save-rules'

// The store's part of saving: enteredFrom and restoreSave. The rest of
// saving (when, where) is in src/save/ and has its own tests.

// validMap is 3×3 with walls on the top row. 'room-2' leads back to 'room-1'
// through (2, 0), so arriving from 'room-1' puts the player at (2, 1); its
// playerStart is (0, 2), so a test can tell the two apart.
const room2: Room = {
  ...validRoom,
  id: 'room-2',
  description: 'The second room.',
  playerStart: { x: 0, y: 2 },
  exits: [{ tiles: [{ x: 2, y: 0 }], to: 'room-1' }],
}

const savedInRoom2: SaveContent = {
  currentRoomId: 'room-2',
  enteredFrom: 'room-1',
  health: 5,
  inventory: ['gold-key'],
  foundLockedExit: true,
  takenItemIds: ['room-1/key-1'],
  defeatedEnemyIds: ['room-1/e1'],
}

function texts(store: ReturnType<typeof createGameStore>): string[] {
  return store.getState().log.map((entry) => entry.text)
}

describe('game store enteredFrom', () => {
  it('is null in a new game, also after the first room loads', () => {
    const store = createGameStore()
    expect(store.getState().enteredFrom).toBeNull()
    store.getState().loadRoom(validRoom, validMap)
    expect(store.getState().enteredFrom).toBeNull()
  })

  it('remembers the room the player came from after loadRoom clears arrivingFrom', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('west')
    store.getState().takeExit()
    store.getState().loadRoom(room2, validMap)
    expect(store.getState().arrivingFrom).toBeNull()
    expect(store.getState().enteredFrom).toBe('room-1')
  })
})

describe('game store restoreSave', () => {
  it('at start-up sets the saved fields and the room to load, at the doorway', () => {
    const store = createGameStore()
    store.getState().restoreSave(savedInRoom2, null)
    const state = store.getState()
    expect(state.currentRoomId).toBe('room-2')
    expect(state.arrivingFrom).toBe('room-1')
    expect(state.enteredFrom).toBe('room-1')
    expect(state.player).toEqual({ ...PLAYER, currentHealth: 5 })
    expect(state.inventory).toEqual(['gold-key'])
    expect(state.takenItemIds).toEqual(['room-1/key-1'])
    expect(state.defeatedEnemyIds).toEqual(['room-1/e1'])
    // Nothing is loaded yet: RoomLoader does that, as for an exit.
    expect(state.room).toBeNull()
  })

  it('places the player at the doorway when RoomLoader then loads the room', () => {
    const store = createGameStore()
    store.getState().restoreSave(savedInRoom2, null)
    store.getState().loadRoom(room2, validMap)
    expect(store.getState().playerPosition).toEqual({ x: 2, y: 1 })
    expect(store.getState().enteredFrom).toBe('room-1')
    // The arrival exit is the way back, as if the player had walked in.
    expect(store.getState().arrivalExitIndex).toBe(0)
  })

  it('places the player at playerStart when the save has no room entered from', () => {
    const store = createGameStore()
    store.getState().restoreSave({ ...savedInRoom2, enteredFrom: null }, null)
    store.getState().loadRoom(room2, validMap)
    expect(store.getState().playerPosition).toEqual({ x: 0, y: 2 })
  })

  it('leaves out the saved defeated enemies when the room loads', () => {
    const roomWithEnemy: Room = {
      ...room2,
      enemies: [{ id: 'e1', type: 'skeleton', position: { x: 0, y: 1 } }],
    }
    const store = createGameStore()
    store
      .getState()
      .restoreSave({ ...savedInRoom2, defeatedEnemyIds: ['room-2/e1'] }, null)
    store.getState().loadRoom(roomWithEnemy, validMap)
    expect(store.getState().enemies).toEqual([])
  })

  it('logs the line with the description of the room it loads', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().restoreSave(savedInRoom2, 'A newer save was loaded.')
    // currentRoomId changed, so RoomLoader fetches room-2 and calls loadRoom.
    store.getState().loadRoom(room2, validMap)
    expect(texts(store).slice(-3)).toEqual([
      'A newer save was loaded.',
      'The second room.',
      'The way back is to the north.',
    ])
  })

  it('loads the room again itself when the saved room is the one on screen', () => {
    const store = createGameStore()
    store.getState().loadRoom(room2, validMap)
    // The player starts at playerStart (0, 2) in a new game.
    expect(store.getState().playerPosition).toEqual({ x: 0, y: 2 })
    store.getState().restoreSave(savedInRoom2, 'A newer save was loaded.')
    // currentRoomId didn't change, so RoomLoader wouldn't fetch anything:
    // the room must already be loaded again, at the doorway.
    const state = store.getState()
    expect(state.room?.id).toBe('room-2')
    expect(state.playerPosition).toEqual({ x: 2, y: 1 })
    expect(texts(store).slice(-3)).toEqual([
      'A newer save was loaded.',
      'The second room.',
      'The way back is to the north.',
    ])
  })

  it('ends a fight, and a victory, from the game it replaces', () => {
    const store = createGameStore()
    store.setState({ hasEscaped: true })
    store.getState().restoreSave(savedInRoom2, null)
    expect(store.getState().hasEscaped).toBe(false)
    expect(store.getState().combat).toBeNull()
  })

  it('drops exit lines still waiting from the game it replaces', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('west')
    store.getState().takeExit()
    store.getState().restoreSave(savedInRoom2, null)
    expect(store.getState().pendingExitLines).toEqual([])
  })
})
