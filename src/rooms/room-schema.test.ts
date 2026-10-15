import { describe, it, expect } from 'vitest'
// roomSchema is a value (the schema we call), so it needs a normal import.
// Room is only a type, so it can stay a type-only import.
import { roomSchema } from './room-schema'
import type { Room } from './room-schema'

// A room that should pass every rule. Each failing test copies it and breaks
// exactly one thing, so we know which rule caused the failure.
// The Room annotation makes TypeScript warn us if this fixture drifts from the schema.
const validRoom: Room = {
  id: 'room-1',
  name: 'Room 1',
  map: 'map-1',
  playerStart: { x: 0, y: 0 },
  description: 'A simple room.',
  exits: [
    { position: { x: 1, y: 0 }, to: 'room-2' },
    { position: { x: 0, y: 1 }, to: 'room-3' },
  ],
}

describe('roomSchema', () => {
  it('accepts a valid room', () => {
    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(validRoom)

    // Assert: success is true when the data matches every rule
    expect(result.success).toBe(true)
  })
})
