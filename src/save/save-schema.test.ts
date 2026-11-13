import { describe, it, expect } from 'vitest'
import {
  isSave,
  saveSchema,
  saveSlotSchema,
  storedSettingsSchema,
  type Save,
} from './save-schema'

const validSave: Save = {
  version: 1,
  currentRoomId: 'dingy-basement',
  enteredFrom: 'entrance-hall',
  health: 7,
  inventory: ['gold-key'],
  foundLockedExit: true,
  takenItemIds: ['entrance-hall/key-1'],
  defeatedEnemyIds: ['entrance-hall/e1'],
  updatedAt: '2026-11-09T10:00:00.000Z',
}

describe('save schema', () => {
  it('accepts a valid save', () => {
    expect(saveSchema.parse(validSave)).toEqual(validSave)
  })

  it('accepts a save from the first room of a new game (enteredFrom null)', () => {
    expect(
      saveSchema.safeParse({ ...validSave, enteredFrom: null }).success,
    ).toBe(true)
  })

  it('accepts a timestamp the way Postgres writes it', () => {
    const save = { ...validSave, updatedAt: '2026-11-09T10:00:00+00:00' }
    expect(saveSchema.safeParse(save).success).toBe(true)
  })

  it('rejects an old version', () => {
    expect(saveSchema.safeParse({ ...validSave, version: 0 }).success).toBe(
      false,
    )
  })

  it('rejects a save with a missing field', () => {
    // Partial<Save> makes every field optional, so `delete` is allowed.
    const withoutHealth: Partial<Save> = { ...validSave }
    delete withoutHealth.health
    expect(saveSchema.safeParse(withoutHealth).success).toBe(false)
  })

  it('loads a save from before foundLockedExit existed, with it false', () => {
    // Saves written before Nov 13 have no foundLockedExit. They must still
    // load (same version), with the safe default.
    const oldSave: Partial<Save> = { ...validSave }
    delete oldSave.foundLockedExit
    expect(saveSchema.parse(oldSave)).toEqual({
      ...validSave,
      foundLockedExit: false,
    })
    // The same through the slot schema, which is what the save code reads.
    expect(saveSlotSchema.parse(oldSave)).toEqual({
      ...validSave,
      foundLockedExit: false,
    })
  })

  it('rejects a foundLockedExit that is not true or false', () => {
    const save = { ...validSave, foundLockedExit: 'yes' }
    expect(saveSchema.safeParse(save).success).toBe(false)
  })

  it('rejects an unknown field (strict)', () => {
    const save = { ...validSave, position: { x: 1, y: 1 } }
    expect(saveSchema.safeParse(save).success).toBe(false)
  })

  it('rejects health of 0 (game over) and above the maximum', () => {
    expect(saveSchema.safeParse({ ...validSave, health: 0 }).success).toBe(
      false,
    )
    expect(saveSchema.safeParse({ ...validSave, health: 13 }).success).toBe(
      false,
    )
    expect(saveSchema.safeParse({ ...validSave, health: 2.5 }).success).toBe(
      false,
    )
  })

  it('rejects a timestamp that is not a date', () => {
    const save = { ...validSave, updatedAt: 'yesterday' }
    expect(saveSchema.safeParse(save).success).toBe(false)
  })
})

describe('save slot schema', () => {
  const ended = {
    version: 1,
    ended: true,
    updatedAt: '2026-11-09T10:00:00.000Z',
  }

  it('accepts a save and an ended game, and tells them apart', () => {
    const save = saveSlotSchema.parse(validSave)
    const endedGame = saveSlotSchema.parse(ended)
    expect(isSave(save)).toBe(true)
    expect(isSave(endedGame)).toBe(false)
  })

  it('rejects an ended game with save fields mixed in', () => {
    const mixed = { ...validSave, ended: true }
    expect(saveSlotSchema.safeParse(mixed).success).toBe(false)
  })

  it('rejects something that is neither', () => {
    expect(saveSlotSchema.safeParse({ hello: 'world' }).success).toBe(false)
    expect(saveSlotSchema.safeParse(null).success).toBe(false)
  })
})

describe('stored settings schema', () => {
  const settings = {
    reducedMotion: false,
    highContrast: true,
    textSize: 'large',
    logVerbosity: 'brief',
  }

  it('accepts settings with a time', () => {
    const stored = { settings, updatedAt: '2026-11-09T10:00:00.000Z' }
    expect(storedSettingsSchema.safeParse(stored).success).toBe(true)
  })

  it('rejects settings without a time, or with a wrong setting', () => {
    expect(storedSettingsSchema.safeParse({ settings }).success).toBe(false)
    const wrong = {
      settings: { ...settings, textSize: 'huge' },
      updatedAt: '2026-11-09T10:00:00.000Z',
    }
    expect(storedSettingsSchema.safeParse(wrong).success).toBe(false)
  })
})
