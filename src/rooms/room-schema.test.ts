import { describe, it, expect } from 'vitest'
// roomSchema is a value (the schema we call), so it needs a normal import.
// Room is only a type, so it can stay a type-only import.
import { roomSchema } from './room-schema'
import type { Room } from './room-schema'
import { validRoom } from './testing-map'

describe('roomSchema', () => {
  it('accepts a valid room', () => {
    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(validRoom)

    // Assert: success is true when the data matches every rule
    expect(result.success).toBe(true)
  })

  it('rejects a room with a missing field', () => {
    // Arrange: copy the valid room and delete one field
    const invalidRoom: Partial<Room> = { ...validRoom }
    delete invalidRoom.name

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the room is rejected, and the issue points at the missing name field
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['name'])
  })

  it('rejects a room with a bad id', () => {
    // Arrange: copy the valid room and change the id to an invalid value
    const invalidRoom: Room = { ...validRoom, id: 'Room 1' }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the room is rejected...
    expect(result.success).toBe(false)
    // ...and the first issue points at the id field, not some other field.
    // `?.` is needed because `error` only exists when parsing fails, and
    // `issues[0]` could be missing (noUncheckedIndexedAccess).
    // `path` is an array (nested fields give e.g. ['exits', 0, 'to']), so we use toEqual.
    expect(result.error?.issues[0]?.path).toEqual(['id'])
  })

  it('rejects an exit with no tiles', () => {
    // Arrange: copy the valid room and give its exit an empty tiles array
    const invalidRoom: Room = {
      ...validRoom,
      exits: [{ tiles: [], to: 'room-2' }],
    }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the issue points at the tiles of the first exit
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['exits', 0, 'tiles'])
  })

  it('rejects enemies with the same id', () => {
    // Arrange: copy the valid room and give it two enemies with the same id
    const invalidRoom: Room = {
      ...validRoom,
      enemies: [
        { id: 'enemy-1', type: 'skeleton', position: { x: 1, y: 1 } },
        { id: 'enemy-1', type: 'orc', position: { x: 2, y: 2 } },
      ],
    }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the issue points at the id of the second enemy
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['enemies', 1, 'id'])
  })

  it('rejects an enemy with a bad id', () => {
    // Arrange: copy the valid room and give its enemy an invalid id
    const invalidRoom: Room = {
      ...validRoom,
      enemies: [{ id: 'Enemy 1', type: 'skeleton', position: { x: 1, y: 1 } }],
    }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the issue points at the id of the first enemy
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['enemies', 0, 'id'])
  })

  it('rejects an enemy with the id "player"', () => {
    // Arrange: copy the valid room and give its enemy the id "player"
    const invalidRoom: Room = {
      ...validRoom,
      enemies: [{ id: 'player', type: 'skeleton', position: { x: 1, y: 1 } }],
    }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the issue points at the id of the first enemy
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['enemies', 0, 'id'])
  })

  it('rejects an enemy with an unknown type', () => {
    // Arrange: copy the valid room and give its enemy an unknown type
    const invalidRoom: Room = {
      ...validRoom,
      enemies: [
        { id: 'enemy-1', type: 'unknown-type', position: { x: 1, y: 1 } },
      ],
    }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the issue points at the type of the first enemy
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['enemies', 0, 'type'])
  })

  it('rejects a room with a missing enemies field', () => {
    // Arrange: copy the valid room and delete the enemies field
    const invalidRoom: Partial<Room> = { ...validRoom }
    delete invalidRoom.enemies

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(invalidRoom)

    // Assert: the issue points at the enemies field
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['enemies'])
  })

  it('accepts a room with a valid enemies field', () => {
    // Arrange: copy the valid room and give it a valid enemies field
    const validRoomWithEnemies: Room = {
      ...validRoom,
      enemies: [
        { id: 'enemy-1', type: 'skeleton', position: { x: 1, y: 1 } },
        { id: 'enemy-2', type: 'orc', position: { x: 2, y: 2 } },
      ],
    }

    // Act: run the Zod schema on the data, at runtime
    const result = roomSchema.safeParse(validRoomWithEnemies)

    // Assert: the room is accepted
    expect(result.success).toBe(true)
  })
})

describe('roomSchema exits', () => {
  it('accepts a locked exit that requires a known item type', () => {
    const room: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], to: 'room-2', requires: 'gold-key' }],
    }
    expect(roomSchema.safeParse(room).success).toBe(true)
  })

  it('rejects a locked exit that requires an unknown item type', () => {
    const room: Room = {
      ...validRoom,
      exits: [
        { tiles: [{ x: 0, y: 0 }], to: 'room-2', requires: 'golden-key' },
      ],
    }
    const result = roomSchema.safeParse(room)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['exits', 0, 'requires'])
  })

  it('accepts a final exit with no room to lead to', () => {
    const room: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], final: true }],
    }
    expect(roomSchema.safeParse(room).success).toBe(true)
  })

  it('accepts a locked final exit', () => {
    const room: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], final: true, requires: 'gold-key' }],
    }
    expect(roomSchema.safeParse(room).success).toBe(true)
  })

  // The next three are not valid Rooms, so TypeScript would reject them as
  // Room. Plain objects let the test give Zod the broken data on purpose.
  it('rejects an exit with both a room to lead to and final', () => {
    const room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], to: 'room-2', final: true }],
    }
    const result = roomSchema.safeParse(room)
    expect(result.success).toBe(false)
    // A union reports one issue for the whole exit when no shape matches.
    expect(result.error?.issues[0]?.path).toEqual(['exits', 0])
  })

  it('rejects an exit with neither a room to lead to nor final', () => {
    const room = { ...validRoom, exits: [{ tiles: [{ x: 0, y: 0 }] }] }
    const result = roomSchema.safeParse(room)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['exits', 0])
  })

  it('rejects final: false', () => {
    // Only `true` is allowed: an exit that isn't final has `to` instead.
    const room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], to: 'room-2', final: false }],
    }
    expect(roomSchema.safeParse(room).success).toBe(false)
  })
})

describe('roomSchema items', () => {
  it('accepts a room with an item of a known type', () => {
    const room: Room = {
      ...validRoom,
      items: [{ id: 'key-1', type: 'gold-key', position: { x: 2, y: 2 } }],
    }
    expect(roomSchema.safeParse(room).success).toBe(true)
  })

  it('rejects a room with a missing items field', () => {
    const invalidRoom: Partial<Room> = { ...validRoom }
    delete invalidRoom.items
    const result = roomSchema.safeParse(invalidRoom)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['items'])
  })

  it('rejects an item with an unknown type', () => {
    const invalidRoom: Room = {
      ...validRoom,
      items: [{ id: 'key-1', type: 'golden-key', position: { x: 2, y: 2 } }],
    }
    const result = roomSchema.safeParse(invalidRoom)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['items', 0, 'type'])
  })

  it('rejects an item with an id that is not kebab-case', () => {
    const invalidRoom: Room = {
      ...validRoom,
      items: [{ id: 'Key 1', type: 'gold-key', position: { x: 2, y: 2 } }],
    }
    const result = roomSchema.safeParse(invalidRoom)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['items', 0, 'id'])
  })

  it('rejects items with the same id', () => {
    const invalidRoom: Room = {
      ...validRoom,
      items: [
        { id: 'key-1', type: 'gold-key', position: { x: 2, y: 2 } },
        { id: 'key-1', type: 'gold-key', position: { x: 0, y: 2 } },
      ],
    }
    const result = roomSchema.safeParse(invalidRoom)
    expect(result.success).toBe(false)
    // The second item is the duplicate, so the issue points at it.
    expect(result.error?.issues[0]?.path).toEqual(['items', 1, 'id'])
  })
})
