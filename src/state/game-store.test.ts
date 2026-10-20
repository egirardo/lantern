import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import { validMap, validRoom } from '../rooms/testing-map'
import type { GameState } from './game-store'
import { describeMove } from '../game/narration'
import type { Room } from '../rooms/room-schema'
import { ZodError } from 'zod'

describe('gameStore', () => {
  it('starts empty', () => {
    const store = createGameStore()
    const state: GameState = store.getState()
    expect(state.playerPosition).toBeNull()
    expect(state.grid).toBeNull()
    expect(state.room).toBeNull()
    expect(state.log).toEqual([])
  })

  it('loadRoom sets the grid and position and logs the description', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    const state: GameState = store.getState()
    // The grid built from validMap: walls along the top row, floor below
    expect(state.grid).toEqual([
      ['wall', 'wall', 'wall'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ])
    expect(state.playerPosition).toEqual(validRoom.playerStart)
    expect(state.room).toEqual(validRoom)
    expect(state.log.length).toBe(1)
    expect(state.log[0]?.text).toBe(validRoom.description)
  })

  it('movePlayer onto floor updates the position and logs it', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('south')
    const state: GameState = store.getState()
    const describeMoveResult = describeMove(
      { moved: true, newPosition: { x: 1, y: 2 } },
      'south',
    )
    expect(state.log.length).toBe(2)
    expect(state.playerPosition).toEqual({ x: 1, y: 2 })
    expect(state.log[1]?.text).toBe(describeMoveResult)
  })

  it('movePlayer into a wall keeps the position but still logs it', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('north')
    // north is a wall in the test map
    const describeMoveResult = describeMove(
      { moved: false, newPosition: { x: 1, y: 1 }, reason: 'wall' },
      'north',
    )
    const state: GameState = store.getState()
    expect(state.playerPosition).toEqual({ x: 1, y: 1 })
    expect(state.log[1]?.text).toBe(describeMoveResult)
    expect(state.log.length).toBe(2)
  })

  it('movePlayer before loadRoom does nothing', () => {
    const store = createGameStore()
    store.getState().movePlayer('south')
    const state: GameState = store.getState()
    expect(state.playerPosition).toBeNull()
    expect(state.grid).toBeNull()
    expect(state.room).toBeNull()
    expect(state.log.length).toBe(0)
  })

  it('two stores from the factory do not share state', () => {
    const store1 = createGameStore()
    const store2 = createGameStore()
    store1.getState().loadRoom(validRoom, validMap)
    const state1: GameState = store1.getState()
    const state2: GameState = store2.getState()
    expect(state2.playerPosition).toBeNull()
    expect(state2.grid).toBeNull()
    expect(state2.room).toBeNull()
    expect(state2.log.length).toEqual(0)
    expect(state1.room).toEqual(validRoom)
  })

  it('loadRoom with invalid data throws, and the state stays empty', () => {
    const store = createGameStore()
    const roomWithoutName: Partial<Room> = { ...validRoom }
    delete roomWithoutName.name
    expect(() => store.getState().loadRoom(roomWithoutName, validMap)).toThrow(
      ZodError,
    )
    const state: GameState = store.getState()
    expect(state.playerPosition).toBeNull()
    expect(state.grid).toBeNull()
    expect(state.room).toBeNull()
    expect(state.log.length).toBe(0)
  })
})
