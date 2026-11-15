import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  readLocalSave,
  readLocalSettings,
  SAVE_KEY,
  SETTINGS_KEY,
  writeLocalSave,
  writeLocalSettings,
} from './local-store'
import type { Save, StoredSettings } from './save-schema'
import { fakeStorage } from './test-storage'

const save: Save = {
  version: 1,
  currentRoomId: 'dingy-basement',
  enteredFrom: 'entrance-hall',
  health: 7,
  inventory: [],
  foundLockedExit: false,
  takenItemIds: [],
  defeatedEnemyIds: [],
  updatedAt: '2026-11-09T10:00:00.000Z',
}

const stored: StoredSettings = {
  settings: {
    reducedMotion: true,
    highContrast: false,
    textSize: 'larger',
    logVerbosity: 'verbose',
  },
  updatedAt: '2026-11-09T10:00:00.000Z',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('local save', () => {
  it('reads back what was written', () => {
    const storage = fakeStorage()
    writeLocalSave(storage, save)
    expect(readLocalSave(storage)).toEqual(save)
    // Stored as JSON text under the key DevTools shows.
    expect(JSON.parse(storage.values.get(SAVE_KEY) ?? '')).toEqual(save)
  })

  it('is null for a new player, without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readLocalSave(fakeStorage())).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })

  it('ignores an old-version save with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = fakeStorage()
    storage.values.set(SAVE_KEY, JSON.stringify({ ...save, version: 0 }))
    expect(readLocalSave(storage)).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
  })

  it('reads an old save without foundLockedExit as false', () => {
    const storage = fakeStorage()
    const oldSave: Partial<Save> = { ...save, foundLockedExit: true }
    delete oldSave.foundLockedExit
    storage.values.set(SAVE_KEY, JSON.stringify(oldSave))
    expect(readLocalSave(storage)).toEqual({ ...save, foundLockedExit: false })
  })

  it('ignores text that is not JSON with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = fakeStorage()
    storage.values.set(SAVE_KEY, '{not json')
    expect(readLocalSave(storage)).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
  })

  it('does not throw when localStorage is blocked', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(readLocalSave(blocked)).toBeNull()
    expect(() => writeLocalSave(blocked, save)).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(2)
  })
})

describe('local settings', () => {
  it('reads back what was written', () => {
    const storage = fakeStorage()
    writeLocalSettings(storage, stored)
    expect(readLocalSettings(storage)).toEqual(stored)
    expect(storage.values.has(SETTINGS_KEY)).toBe(true)
  })

  it('ignores settings with an unknown value with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = fakeStorage()
    const broken = { ...stored, settings: { ...stored.settings, textSize: 9 } }
    storage.values.set(SETTINGS_KEY, JSON.stringify(broken))
    expect(readLocalSettings(storage)).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
  })
})
