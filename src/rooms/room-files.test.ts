import { describe, it, expect } from 'vitest'
import { loadRoom } from './load-room'
import { roomSchema } from './room-schema'

// Checks the real room files in public/, not test fixtures. Every room is
// found automatically, so rooms added later (also by agents) are checked in
// CI without writing a new test.

// import.meta.glob is a Vite feature: it finds every file matching the
// pattern when the test is built. The pattern must be a plain string, because
// Vite reads it before the code runs.
// eager: true loads the files right away (instead of returning functions that
// load them later), and import: 'default' gives the file content itself.
// The result is an object keyed by path, e.g.
// { '../../public/rooms/entrance-hall.json': { id: 'entrance-hall', ... } }
const roomFiles = import.meta.glob('../../public/rooms/*.json', {
  eager: true,
  import: 'default',
})

// Vite doesn't know the .tmj extension, so ?raw loads each map as a string
// and the test parses it with JSON.parse.
const mapFiles = import.meta.glob<string>('../../public/maps/*.tmj', {
  eager: true,
  query: '?raw',
  import: 'default',
})

describe('room files', () => {
  it('finds at least one room', () => {
    // Without this, a typo in the glob pattern would give it.each an empty
    // list. Zero tests count as a pass, so CI would be green while checking nothing.
    expect(Object.keys(roomFiles).length).toBeGreaterThan(0)
  })

  // One test per room file. Object.entries turns the object into
  // [path, data] pairs. %s in the name is replaced with the first value of
  // each pair (the path), so a failure says which room broke.
  it.each(Object.entries(roomFiles))('%s loads with its map', (path, data) => {
    // Parse the room first to read its id and map name. If the room file is
    // invalid, this throws a ZodError that points at the broken field.
    const room = roomSchema.parse(data)

    // The file name must match the id: entrance-hall.json has id 'entrance-hall'.
    expect(path).toBe(`../../public/rooms/${room.id}.json`)

    // The room's map field must name a map file that exists.
    const mapText = mapFiles[`../../public/maps/${room.map}.tmj`]
    // Throwing fails the test, and narrows mapText from string | undefined
    // to string for the lines below (the same early-exit pattern as the store).
    if (mapText === undefined) {
      throw new Error(
        `Room "${room.id}" uses map "${room.map}", but there is no public/maps/${room.map}.tmj`,
      )
    }

    // The full check: schemas, grid, start position and exits.
    expect(() => loadRoom(data, JSON.parse(mapText))).not.toThrow()
  })
})
