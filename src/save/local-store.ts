import type { z } from 'zod'
import {
  saveSlotSchema,
  storedSettingsSchema,
  type SaveSlot,
  type StoredSettings,
} from './save-schema'

// Reads and writes the save and settings in localStorage (rule 8: always
// here, signed in or not). A thin layer like remote-store.ts: it turns JSON
// text into checked objects and back, and nothing else.
//
// Unlike remote-store.ts, nothing here throws. localStorage can fail (it's
// blocked in some private modes, or full), and a broken or old save must
// never stop the game: the player just gets a new game, and a console.warn
// says why, for us in DevTools.

// The keys to look for in DevTools → Application → Local Storage.
export const SAVE_KEY = 'lantern-save'
export const SETTINGS_KEY = 'lantern-settings'

// Only the two methods we use, so a test can pass a small fake object.
// The real localStorage has both, so it fits this type.
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readLocalSave(storage: KeyValueStorage): SaveSlot | null {
  return readChecked(storage, SAVE_KEY, saveSlotSchema)
}

export function writeLocalSave(storage: KeyValueStorage, slot: SaveSlot) {
  writeJson(storage, SAVE_KEY, slot)
}

export function readLocalSettings(
  storage: KeyValueStorage,
): StoredSettings | null {
  return readChecked(storage, SETTINGS_KEY, storedSettingsSchema)
}

export function writeLocalSettings(
  storage: KeyValueStorage,
  stored: StoredSettings,
) {
  writeJson(storage, SETTINGS_KEY, stored)
}

// Returns the checked value, or null when there is none or it's unusable.
// A generic function: <T> stands for whatever type the schema describes, so
// readChecked(…, saveSlotSchema) returns a SaveSlot and
// readChecked(…, storedSettingsSchema) a StoredSettings.
function readChecked<T>(
  storage: KeyValueStorage,
  key: string,
  schema: z.ZodType<T>,
): T | null {
  let text: string | null
  try {
    text = storage.getItem(key)
  } catch (error) {
    console.warn(`Couldn't read ${key} from localStorage`, error)
    return null
  }
  // Nothing saved yet: a new player, not an error.
  if (text === null) return null

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (error) {
    console.warn(`Ignoring ${key}: it isn't valid JSON`, error)
    return null
  }

  // safeParse returns { success, data } or { success: false, error }
  // instead of throwing like parse().
  const result = schema.safeParse(json)
  if (!result.success) {
    console.warn(
      `Ignoring ${key}: it's from an older version or broken`,
      result.error,
    )
    return null
  }
  return result.data
}

function writeJson(storage: KeyValueStorage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Full or blocked storage: the game goes on, only this save is lost.
    console.warn(`Couldn't write ${key} to localStorage`, error)
  }
}
