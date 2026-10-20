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
})
