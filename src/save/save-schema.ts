import { z } from 'zod'
import { PLAYER } from '../game/player'
import { settingsSchema } from '../state/settings'

// The shapes of what is saved, in localStorage and in Supabase (rule 8).
// Both places store exactly the same JSON, so one set of schemas checks both.
// Saved data can't be trusted (an old version, a hand-edited value in
// DevTools, a bug in an older build), so everything read back is parsed with
// these schemas before it reaches the store.

// Bump this when the save shape changes. An old save then fails the
// z.literal check below and is ignored (a new game) instead of being loaded
// with missing or wrongly shaped fields.
export const SAVE_VERSION = 1

// A timestamp that Date.parse() can read, e.g. "2026-11-09T10:00:00.000Z".
// Not z.iso.datetime(): Postgres sends "+00:00" instead of "Z" and may leave
// out the milliseconds, and newest-wins only needs Date.parse() to work.
const timestampSchema = z
  .string()
  .refine((text) => !Number.isNaN(Date.parse(text)), {
    message: 'Not a readable timestamp',
  })

// A checkpoint at the doorway (decided Nov 9). It saves which room the player
// is in and which room they came from, not the exact tile: loading puts them
// at the doorway that leads back (findArrivalPosition), the same as walking
// in through it.
export const saveSchema = z.strictObject({
  version: z.literal(SAVE_VERSION),
  currentRoomId: z.string().min(1),
  // null in the first room of a new game, which places the player at
  // playerStart instead of at a doorway.
  enteredFrom: z.string().min(1).nullable(),
  // A save is never made at 0 health (that's game over), so 0 is invalid.
  health: z.number().int().min(1).max(PLAYER.maxHealth),
  inventory: z.array(z.string()),
  takenItemIds: z.array(z.string()),
  defeatedEnemyIds: z.array(z.string()),
  updatedAt: timestampSchema,
})

// What is stored after game over or victory: "this game has ended", and when.
// Why not just delete the save? Because of newest-wins across devices. If
// this device only deleted its save, the older save still in Supabase (or
// on another device) would look like the only save at the next sync and
// would win, and the finished game would come back. A record with a newer
// updatedAt beats it instead. For the player it works like a deleted save:
// the next page load starts a new game.
export const endedSchema = z.strictObject({
  version: z.literal(SAVE_VERSION),
  ended: z.literal(true),
  updatedAt: timestampSchema,
})

// The one save slot: a game in progress, or a game that has ended.
// z.union tries each schema in turn and takes the first that fits. They
// can't both fit, because both are strict and only one has `ended`.
export const saveSlotSchema = z.union([saveSchema, endedSchema])

// Settings with the time they were changed, for newest-wins. In Supabase the
// time is its own column (updated_at), so only `settings` goes in `data`;
// localStorage has no columns, so both are stored together.
export const storedSettingsSchema = z.strictObject({
  settings: settingsSchema,
  updatedAt: timestampSchema,
})

export type Save = z.infer<typeof saveSchema>
export type EndedGame = z.infer<typeof endedSchema>
export type SaveSlot = z.infer<typeof saveSlotSchema>
export type StoredSettings = z.infer<typeof storedSettingsSchema>

// True for a game in progress, false for an ended one. A type guard: after
// `if (isSave(slot))`, TypeScript knows slot is a Save (narrowing).
export function isSave(slot: SaveSlot): slot is Save {
  return !('ended' in slot)
}
