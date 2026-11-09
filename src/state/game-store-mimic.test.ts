import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import { validMap, validRoom } from '../rooms/testing-map'
import type { Room } from '../rooms/room-schema'
import { getAttackOptions } from '../game/narration'
import { rollOf, sequence } from '../game/test-helpers'

// The mimic from start to finish in the store (decided Nov 9), with the real
// enemies.json: a mimic disguised as a chest, with 12 health, carrying the
// gold key that opens the locked exit. In its own file so it doesn't touch
// game-store.test.ts, which other branches change at the same time.
//
// On validMap (walls along the top row, floor below):
//   [X, W, W]   X = the locked exit at (0, 0)
//   [F, P, F]   P = the player's start (1, 1)
//   [F, F, M]   M = the mimic at (2, 2), diagonal to the start, so no fight
// One step east puts the player at (2, 1), right above the mimic.
const vault: Room = {
  ...validRoom,
  exits: [{ tiles: [{ x: 0, y: 0 }], to: 'room-2', requires: 'gold-key' }],
  enemies: [
    {
      id: 'mimic-1',
      type: 'mimic',
      position: { x: 2, y: 2 },
      carries: 'gold-key',
    },
  ],
}

// The dice for: the player's initiative (20), the mimic's (1), so the player
// goes first and the mimic doesn't attack yet. Then the player's attack: a
// natural 20 is a critical hit with two d6, and 6 + 6 = 12 kills the mimic
// with its 12 health in one blow.
const winInOneBlow = [
  rollOf(20, 20),
  rollOf(1, 20),
  rollOf(20, 20),
  rollOf(6, 6),
  rollOf(6, 6),
]

function texts(store: ReturnType<typeof createGameStore>): string[] {
  return store.getState().log.map((entry) => entry.text)
}

describe('the mimic in the store', () => {
  it('is announced as a chest when it comes into the light', () => {
    const store = createGameStore()
    store.getState().loadRoom(vault, validMap)
    expect(texts(store)).toContain('A chest appears to the south-east.')
    expect(texts(store).join(' ')).not.toContain('mimic')
  })

  it('springs open when the fight starts, and every line after says "mimic"', () => {
    const store = createGameStore(sequence(...winInOneBlow))
    store.getState().loadRoom(vault, validMap)
    const logLength = store.getState().log.length
    store.getState().movePlayer('east')

    expect(texts(store).slice(logLength)).toEqual([
      'You have taken a step to the east.',
      "The chest springs open. It's a mimic! A fight begins.",
      'You roll initiative: 20 + 2 = 22.',
      'The mimic rolls initiative: 1 + 0 = 1.',
      "It's your turn.",
    ])
    // The store's mimic has lost its disguise, which is what the scene reads
    // to start the open-mouth animation.
    expect(store.getState().enemies[0]).not.toHaveProperty('disguise')
    const combat = store.getState().combat
    expect(combat && getAttackOptions(combat)).toEqual([
      { id: 'mimic-1', label: 'Attack the mimic' },
    ])
  })

  it('puts the gold key straight into the inventory when the mimic is defeated', () => {
    const store = createGameStore(sequence(...winInOneBlow))
    store.getState().loadRoom(vault, validMap)
    store.getState().movePlayer('east')
    store.getState().playerAttack('mimic-1')

    const state = store.getState()
    expect(state.inventory).toEqual(['gold-key'])
    // Not on the floor: no item was added to the room.
    expect(state.items).toEqual([])
    expect(state.defeatedEnemyIds).toEqual(['room-1/mimic-1'])
    expect(texts(store).slice(-4)).toEqual([
      'The mimic is defeated.',
      'The mimic drops a gold key. You pick it up.',
      'Victory. No enemies are left standing.',
      'You recover 0 health. You have 12 out of 12 health.',
    ])
  })

  it("opens the locked exit with the mimic's key, like a key from the floor", () => {
    const store = createGameStore(sequence(...winInOneBlow))
    store.getState().loadRoom(vault, validMap)
    store.getState().movePlayer('east')
    store.getState().playerAttack('mimic-1')
    // Back west to (0, 1), below the locked exit.
    store.getState().movePlayer('west')
    store.getState().movePlayer('west')
    store.getState().takeExit()

    expect(store.getState().currentRoomId).toBe('room-2')
    expect(store.getState().pendingExitLines[0]?.text).toBe(
      'You unlock the door with the gold key.',
    )
  })

  it("can't give the key twice: the defeated mimic stays gone when the room loads again", () => {
    const store = createGameStore(sequence(...winInOneBlow))
    store.getState().loadRoom(vault, validMap)
    store.getState().movePlayer('east')
    store.getState().playerAttack('mimic-1')
    store.getState().loadRoom(vault, validMap)

    expect(store.getState().enemies).toEqual([])
    expect(store.getState().inventory).toEqual(['gold-key'])
  })

  // The unmasking isn't saved (a fight can't be left): a new game, like a
  // page reload, spawns the mimic from the room file in its disguise again.
  it('is disguised again in a new game', () => {
    const store = createGameStore()
    store.getState().loadRoom(vault, validMap)
    expect(store.getState().enemies[0]?.disguise).toBe('chest')
  })
})
