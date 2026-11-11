import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import { defaultSettings, type Settings } from './settings'
import type { Direction } from '../game/movement'

// Brief log verbosity (Phase L, decided Nov 9): the log skips the decor
// reveal lines, and keeps every other line. With the real room files, like
// game-store-decor.test.ts, so these tests hear what a player hears.
const roomFiles = import.meta.glob('../../public/rooms/*.json', {
  eager: true,
  import: 'default',
})
const mapFiles = import.meta.glob<string>('../../public/maps/*.tmj', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function filesFor(roomId: string): [unknown, unknown] {
  const room = roomFiles[`../../public/rooms/${roomId}.json`]
  const map = mapFiles[`../../public/maps/${roomId}.tmj`]
  if (room === undefined || map === undefined) {
    throw new Error(`No room files for ${roomId}`)
  }
  return [room, JSON.parse(map)]
}

const brief: Settings = { ...defaultSettings(false), logVerbosity: 'brief' }

// Loads a room as if the player had just come through an exit from
// `arrivingFrom`, with the given settings from the start.
function arrive(roomId: string, arrivingFrom: string, settings: Settings) {
  const store = createGameStore(Math.random, settings)
  store.setState({ arrivingFrom })
  store.getState().loadRoom(...filesFor(roomId))
  return store
}

function texts(store: ReturnType<typeof createGameStore>): string[] {
  return store.getState().log.map((entry) => entry.text)
}

// The log lines added by `act`, so a test only looks at one step.
function linesOf(
  store: ReturnType<typeof createGameStore>,
  act: () => void,
): string[] {
  const before = store.getState().log.length
  act()
  return texts(store).slice(before)
}

function walk(
  store: ReturnType<typeof createGameStore>,
  directions: Direction[],
) {
  for (const direction of directions) store.getState().movePlayer(direction)
}

describe('brief log verbosity', () => {
  // The entrance hall from the basement stairs: the player arrives at (5, 2).
  // Verbose, this gives the demon, the way back and two pillar lines (see
  // game-store-decor.test.ts).
  it('skips decor lines on arrival, and keeps the enemy and exit lines', () => {
    const store = arrive('entrance-hall', 'dingy-basement', brief)
    expect(texts(store).slice(1)).toEqual([
      'A demon appears to the south-east.',
      'The way back is to the north.',
    ])
  })

  it('still marks the decor lit on arrival as seen', () => {
    const store = arrive('entrance-hall', 'dingy-basement', brief)
    expect(store.getState().seenPieceKeys).toEqual(['pillar@4,0', 'pillar@7,0'])
  })

  it('skips the decor line of a step, and keeps the step line', () => {
    // From (5, 2) to (4, 2): the crate at (2, 3) comes into the light.
    const store = arrive('entrance-hall', 'dingy-basement', brief)
    const lines = linesOf(store, () => store.getState().movePlayer('west'))
    expect(lines).toEqual(['You have taken a step to the west.'])
    expect(store.getState().seenPieceKeys).toContain('crate@2,3')
  })

  it('does not announce decor passed in brief after switching to verbose', () => {
    const store = arrive('entrance-hall', 'dingy-basement', brief)
    // West to (4, 2) lights the crate in brief, east back to (5, 2) puts it
    // in the dark, and west again, now verbose, lights it again.
    walk(store, ['west', 'east'])
    store.getState().updateSettings({ logVerbosity: 'verbose' })
    const lines = linesOf(store, () => store.getState().movePlayer('west'))
    expect(lines).toEqual(['You have taken a step to the west.'])
  })

  it('announces decor not seen yet after switching to verbose', () => {
    // The pillars were passed in brief, but the crate wasn't lit yet, so
    // verbose announces the crate (and nothing else).
    const store = arrive('entrance-hall', 'dingy-basement', brief)
    store.getState().updateSettings({ logVerbosity: 'verbose' })
    const lines = linesOf(store, () => store.getState().movePlayer('west'))
    expect(lines).toEqual([
      'You have taken a step to the west.',
      'A crate appears to the west.',
    ])
  })
})
