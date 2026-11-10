import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import type { Direction } from '../game/movement'
import { floorLayer, newMap, validRoom, wallsLayer } from '../rooms/testing-map'
import type { Room } from '../rooms/room-schema'

// Decor reveals in the store (Phase K step 7), with the real room files and
// the real tile-names.json, so these tests hear what a player hears. In its
// own file so it doesn't touch game-store.test.ts.
//
// The room files are loaded like in room-files.test.ts: import.meta.glob
// finds them when the test is built, and ?raw gives each map as a string.
const roomFiles = import.meta.glob('../../public/rooms/*.json', {
  eager: true,
  import: 'default',
})
const mapFiles = import.meta.glob<string>('../../public/maps/*.tmj', {
  eager: true,
  query: '?raw',
  import: 'default',
})

// The room file and map for a room id. Every room's map has the room's id as
// its name (CLAUDE.md, "Building rooms").
function filesFor(roomId: string): [unknown, unknown] {
  const room = roomFiles[`../../public/rooms/${roomId}.json`]
  const map = mapFiles[`../../public/maps/${roomId}.tmj`]
  if (room === undefined || map === undefined) {
    throw new Error(`No room files for ${roomId}`)
  }
  return [room, JSON.parse(map)]
}

// Loads a room as if the player had just come through an exit from
// `arrivingFrom`, which is what takeExit sets before RoomLoader calls
// loadRoom. The player stands at the doorway that leads back.
function arrive(roomId: string, arrivingFrom: string | null) {
  const store = createGameStore()
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

function decorLines(lines: string[], name: RegExp): string[] {
  return lines.filter((line) => name.test(line))
}

describe('decor reveals in the store', () => {
  it('has no seen pieces before a room is loaded', () => {
    expect(createGameStore().getState().seenPieceKeys).toEqual([])
  })

  // The entrance hall from the basement stairs: the player arrives at (5, 2),
  // under the door. The pillars at (4, 0–1) and (7, 0–1) are both lit.
  it('announces decor lit on arrival, after the enemy and exit lines', () => {
    const store = arrive('entrance-hall', 'dingy-basement')
    expect(texts(store).slice(1)).toEqual([
      'A demon appears to the south-east.',
      'The way back is to the north.',
      'A pillar appears to the north-west.',
      'A pillar appears to the east.',
    ])
  })

  it('announces a two-tile pillar once, not once per tile', () => {
    // Both tiles of the pillar at (4, 0–1) are lit from (5, 2), but there is
    // only one line for it. The second pillar line is the other pillar.
    const store = arrive('entrance-hall', 'dingy-basement')
    expect(store.getState().seenPieceKeys).toEqual(['pillar@4,0', 'pillar@7,0'])
    expect(decorLines(texts(store), /pillar/i)).toHaveLength(2)
  })

  it('does not announce decor again in the same visit', () => {
    const store = arrive('entrance-hall', 'dingy-basement')
    // West along row 2 to (1, 2), where both pillars are in the dark, then
    // back east to (4, 2), where the first pillar is lit again.
    walk(store, ['west', 'west', 'west', 'west'])
    const back = linesOf(store, () => walk(store, ['east', 'east', 'east']))
    expect(decorLines(back, /pillar/i)).toEqual([])
    expect(decorLines(texts(store), /pillar/i)).toHaveLength(2)
  })

  it('announces decor lit by a step, after the step line', () => {
    const store = arrive('entrance-hall', 'dingy-basement')
    // From (5, 2) to (4, 2): the crate at (2, 3) comes into the light. It's
    // 2 west and 1 south, which directionFrom calls "west".
    const lines = linesOf(store, () => store.getState().movePlayer('west'))
    expect(lines).toEqual([
      'You have taken a step to the west.',
      'A crate appears to the west.',
    ])
  })

  it('does not announce decor again that a step revealed', () => {
    const store = arrive('entrance-hall', 'dingy-basement')
    // West to (4, 2) reveals the crate at (2, 3). East back to (5, 2) puts it
    // in the dark (3 west, 1 south), and west again lights it again.
    walk(store, ['west', 'east'])
    const again = linesOf(store, () => store.getState().movePlayer('west'))
    expect(decorLines(again, /crate/i)).toEqual([])
    expect(store.getState().seenPieceKeys).toContain('crate@2,3')
  })

  it('announces the decor again after leaving the room and coming back', () => {
    const store = arrive('entrance-hall', 'dingy-basement')
    // Up the stairs at (5, 1) to the basement, and straight back down.
    store.getState().takeExit()
    store.getState().loadRoom(...filesFor('dingy-basement'))
    // The basement's seen list is its own: only its crate, not the pillars.
    expect(store.getState().seenPieceKeys).toEqual(['crate@0,3'])
    store.getState().takeExit()
    const back = linesOf(store, () =>
      store.getState().loadRoom(...filesFor('entrance-hall')),
    )
    expect(decorLines(back, /pillar/i)).toEqual([
      'A pillar appears to the north-west.',
      'A pillar appears to the east.',
    ])
  })

  it('groups several crates lit on arrival in one line', () => {
    // The old crypt from the south carpet, at (5, 8): the crates at (4, 6),
    // (5, 6) and (6, 6) are all to the north.
    const store = arrive('old-crypt', 'dingy-basement')
    expect(decorLines(texts(store), /crate/i)).toEqual([
      'Crates appear to the north.',
    ])
    expect(store.getState().seenPieceKeys).toEqual([
      'crate@4,6',
      'crate@5,6',
      'crate@6,6',
    ])
  })

  it('groups two crates side by side lit by one step, after the enemy line', () => {
    // The basement from the old crypt: the player arrives at (10, 2) by the
    // east mat. Down column 10 to (10, 6), east to (11, 6), then one step
    // south to (11, 7) lights the crates at (10, 9) and (11, 9) together.
    // The skeleton at (9, 8) is in the dark at (11, 6) and lit again at
    // (11, 7), so its line comes first.
    const store = arrive('dingy-basement', 'old-crypt')
    walk(store, ['south', 'south', 'south', 'south', 'east'])
    const lines = linesOf(store, () => store.getState().movePlayer('south'))
    expect(lines).toEqual([
      'You have taken a step to the south.',
      'The skeleton appears to the west.',
      'Crates appear to the south.',
    ])
  })

  it('announces nothing in a room without named decor', () => {
    const store = arrive('forgotten-vault', 'dingy-basement')
    expect(store.getState().seenPieceKeys).toEqual([])
    expect(texts(store)).toEqual([
      'You climb down the ladder into a small, silent vault. The air is cold and still.',
      'The way back is to the north.',
    ])
  })
})

describe('decor reveals in a step that starts a fight', () => {
  // No real room has a step that both starts a fight and lights new decor,
  // so this one uses a small test map with the real crate tile (gid 1427 =
  // local id 1426 in tile-names.json):
  //   (0,0) (1,0)   floor
  //   (0,1) (1,1)   floor
  //   (0,2) (1,2)   C = crate on walls, floor
  //   (0,3) (1,3)   floor
  //   (0,4) (1,4)   floor, S = skeleton
  //   (0,5) (1,5)   P = the player's start, floor
  // From (0, 5) the crate is 3 tiles away, in the dark. One step north to
  // (0, 4) lights it and puts the player next to the skeleton.
  const map = {
    ...newMap(),
    width: 2,
    height: 6,
    layers: [
      { ...floorLayer, width: 2, height: 6, data: Array(12).fill(258) },
      {
        ...wallsLayer,
        width: 2,
        height: 6,
        data: [0, 0, 0, 0, 1427, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
  }
  const room: Room = {
    ...validRoom,
    playerStart: { x: 0, y: 5 },
    exits: [],
    enemies: [{ id: 'skeleton-1', type: 'skeleton', position: { x: 1, y: 4 } }],
  }

  it('remembers the decor and announces it before the fight lines', () => {
    const store = createGameStore()
    store.getState().loadRoom(room, map)
    const lines = linesOf(store, () => store.getState().movePlayer('north'))
    expect(store.getState().combat).not.toBeNull()
    expect(store.getState().seenPieceKeys).toEqual(['crate@0,2'])
    expect(lines.slice(0, 3)).toEqual([
      'You have taken a step to the north.',
      'A crate appears to the north.',
      'The skeleton attacks you! A fight begins.',
    ])
  })
})
