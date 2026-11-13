import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import { validMap, validRoom } from '../rooms/testing-map'
import type { Room } from '../rooms/room-schema'
import { describeGoal } from '../game/goal'
import { buildSave, saveContent } from '../save/save-rules'
import { saveSchema } from '../save/save-schema'

// foundLockedExit in the store (the Goal panel's four steps, Nov 13): when it
// becomes true, when it doesn't, and that it survives a save. In its own file
// so it doesn't touch game-store.test.ts, like the other game-store-*.test.ts
// files.
//
// On validMap (walls along the top row, floor below):
//   [L, W, W]   L = the locked exit at (0, 0), to 'room-2', needs the gold key
//   [F, P, F]   P = the player's start (1, 1)
//   [F, F, F]
// One step west puts the player at (0, 1), right below the locked exit.
const lockedRoom: Room = {
  ...validRoom,
  exits: [{ tiles: [{ x: 0, y: 0 }], to: 'room-2', requires: 'gold-key' }],
}

// 'room-2', with an unlocked way back to 'room-1' through (2, 0).
const room2: Room = {
  ...validRoom,
  id: 'room-2',
  description: 'The second room.',
  exits: [{ tiles: [{ x: 2, y: 0 }], to: 'room-1' }],
}

// A store with lockedRoom loaded and the player right below the locked exit.
function storeBelowLockedExit() {
  const store = createGameStore()
  store.getState().loadRoom(lockedRoom, validMap)
  store.getState().movePlayer('west')
  return store
}

function texts(store: ReturnType<typeof createGameStore>): string[] {
  return store.getState().log.map((entry) => entry.text)
}

describe('game store foundLockedExit', () => {
  it('is false in a new game', () => {
    expect(createGameStore().getState().foundLockedExit).toBe(false)
  })

  it('becomes true when the player tries the locked exit without the key', () => {
    const store = storeBelowLockedExit()
    store.getState().takeExit()
    expect(store.getState().foundLockedExit).toBe(true)
    // At the same moment the log tells the player why.
    expect(texts(store).at(-1)).toBe('The door is locked. You need a key.')
  })

  it('moves the goal from exploring to finding the key at that moment', () => {
    const store = storeBelowLockedExit()
    const before = store.getState()
    expect(describeGoal(before.inventory, before.foundLockedExit).text).toBe(
      'Explore your surroundings.',
    )
    store.getState().takeExit()
    const after = store.getState()
    expect(describeGoal(after.inventory, after.foundLockedExit).text).toBe(
      'Find the gold key.',
    )
  })

  it('stays true when the player tries the door again', () => {
    const store = storeBelowLockedExit()
    store.getState().takeExit()
    store.getState().takeExit()
    expect(store.getState().foundLockedExit).toBe(true)
  })

  it('stays false when the lantern only reveals the locked exit', () => {
    // The exit at (0, 0) is lit from the start (1, 1), so it is announced
    // ("An exit appears…"), but that says nothing about a lock.
    const store = createGameStore()
    store.getState().loadRoom(lockedRoom, validMap)
    expect(texts(store).join(' ')).toContain('exit appears')
    expect(store.getState().foundLockedExit).toBe(false)
  })

  it('stays false when the player walks next to and into the locked exit', () => {
    const store = storeBelowLockedExit()
    // Walking into an exit is a blocked move: "An exit leads north…".
    store.getState().movePlayer('north')
    expect(texts(store).at(-1)).toBe(
      'An exit leads north. Press Enter to use it.',
    )
    expect(store.getState().foundLockedExit).toBe(false)
  })

  it('stays false when the player uses an exit with no exit nearby', () => {
    const store = createGameStore()
    store.getState().loadRoom(lockedRoom, validMap)
    // The start (1, 1) is diagonal to the exit, so it doesn't count.
    store.getState().takeExit()
    expect(texts(store).at(-1)).toBe('There is no exit next to you.')
    expect(store.getState().foundLockedExit).toBe(false)
  })

  it('stays false when the player already carries the key and goes through', () => {
    const store = storeBelowLockedExit()
    store.setState({ inventory: ['gold-key'] })
    store.getState().takeExit()
    // The door was never locked for this player: it opened at once.
    expect(store.getState().currentRoomId).toBe('room-2')
    expect(store.getState().foundLockedExit).toBe(false)
  })

  it('stays false when an unlocked exit is used', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('west')
    store.getState().takeExit()
    expect(store.getState().currentRoomId).toBe('room-2')
    expect(store.getState().foundLockedExit).toBe(false)
  })

  it('is kept across a room change', () => {
    const store = storeBelowLockedExit()
    store.getState().takeExit()
    // The player finds the key and goes through.
    store.setState({ inventory: ['gold-key'] })
    store.getState().takeExit()
    store.getState().loadRoom(room2, validMap)
    expect(store.getState().room?.id).toBe('room-2')
    expect(store.getState().foundLockedExit).toBe(true)
  })
})

describe('foundLockedExit in a save', () => {
  it('survives a save round trip', () => {
    const store = storeBelowLockedExit()
    store.getState().takeExit()
    // What localStorage and Supabase hold is JSON, so the save goes through
    // JSON and the schema on the way back, like a real load.
    const save = buildSave(store.getState(), new Date('2026-11-13T10:00:00Z'))
    const loaded = saveSchema.parse(JSON.parse(JSON.stringify(save)))
    expect(loaded.foundLockedExit).toBe(true)

    // Restored into a fresh store (a page reload).
    const reloaded = createGameStore()
    reloaded.getState().restoreSave(loaded, null)
    expect(reloaded.getState().foundLockedExit).toBe(true)
  })

  it('puts the flag in the save content', () => {
    const store = storeBelowLockedExit()
    expect(saveContent(store.getState()).foundLockedExit).toBe(false)
    store.getState().takeExit()
    expect(saveContent(store.getState()).foundLockedExit).toBe(true)
  })

  it('restoring a save without the door found turns the flag off again', () => {
    // E.g. a newer save from another device, from before the door was tried.
    const store = storeBelowLockedExit()
    store.getState().takeExit()
    const content = { ...saveContent(store.getState()), foundLockedExit: false }
    store.getState().restoreSave(content, null)
    expect(store.getState().foundLockedExit).toBe(false)
  })
})
