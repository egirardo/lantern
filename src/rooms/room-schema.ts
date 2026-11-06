import { z } from 'zod'
import { enemies, enemyIdSchema } from '../game/enemy-schema'
import { PLAYER_ID } from '../game/combat'
import { isItemType, itemIdSchema } from '../game/item-schema'

export const positionSchema = z.strictObject({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
})

export const roomIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  message:
    'Room ID must be in kebab-case (lowercase letters, numbers, and hyphens)',
})

// The fields every exit has, whichever kind it is.
const exitBase = {
  // The blocked tiles (a door or ladder) the player uses the exit from.
  tiles: z.array(positionSchema).min(1),
  // Optional: the exit is locked, and opens only if the player carries an
  // item of this type (a key in items.json, e.g. 'rusty-key'). It names the
  // item type, not the id of one item in a room, because the key lies in a
  // different room from the door. That also lets Zod check it here: a typo
  // would otherwise make the door impossible to open.
  requires: z
    .string()
    .refine(isItemType, { message: 'Unknown item type' })
    .optional(),
}

// There are two kinds of exit, and a union says "one of these shapes":
// - an exit to another room has `to`, the id of the room it leads to.
// - the final exit has `final: true` and no `to`: it leads out of the
//   dungeon, and using it wins the game.
// Both are strictObjects, so an exit with both `to` and `final` (or neither)
// matches neither shape and is rejected. TypeScript gets the same union, so
// code that reads `exit.to` must first check that the exit isn't final.
const roomExitSchema = z.strictObject({ ...exitBase, to: roomIdSchema })
const finalExitSchema = z.strictObject({
  ...exitBase,
  final: z.literal(true),
})
export const exitSchema = z.union([roomExitSchema, finalExitSchema])

export const roomSchema = z.strictObject({
  id: roomIdSchema,
  name: z.string().trim().min(1),
  map: z.string().trim().min(1),
  playerStart: positionSchema,
  description: z.string().trim().min(1),
  exits: z.array(exitSchema),
  enemies: z
    .array(
      z.strictObject({
        id: enemyIdSchema,
        type: z.string().refine((type) => Object.hasOwn(enemies, type), {
          message: 'Unknown enemy type',
        }),
        position: positionSchema,
      }),
    )
    // superRefine (unlike refine) can report an issue at a specific path,
    // so the error points at the exact enemy that has the bad id.
    .superRefine((roomEnemies, ctx) => {
      const seenIds = new Set<string>()
      roomEnemies.forEach((enemy, index) => {
        // 'player' is reserved: combat refers to the player by that id.
        if (enemy.id === PLAYER_ID) {
          ctx.addIssue({
            code: 'custom',
            message: `Enemy ID "${PLAYER_ID}" is reserved for the player`,
            path: [index, 'id'],
          })
        }
        // Combat looks enemies up by id, so two with the same id would
        // make an attack hit the wrong one.
        if (seenIds.has(enemy.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate enemy ID "${enemy.id}"`,
            path: [index, 'id'],
          })
        }
        seenIds.add(enemy.id)
      })
    }),
  // Items lying in the room, e.g. a key. Required like `enemies` (an empty
  // room writes "items": []), so a room file always says what's in it.
  // Picking items up comes later (Agent E): for now they're only data.
  items: z
    .array(
      z.strictObject({
        id: itemIdSchema,
        // The item type, a key in items.json (e.g. 'rusty-key'). It decides
        // the name the log uses.
        type: z.string().refine(isItemType, { message: 'Unknown item type' }),
        position: positionSchema,
      }),
    )
    // Item ids must be unique in the room, for the same reason as enemy
    // ids: the game finds an item by its id (to remove it when picked up).
    .superRefine((roomItems, ctx) => {
      const seenIds = new Set<string>()
      roomItems.forEach((item, index) => {
        if (seenIds.has(item.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate item ID "${item.id}"`,
            path: [index, 'id'],
          })
        }
        seenIds.add(item.id)
      })
    }),
})

export type Room = z.infer<typeof roomSchema>
export type Exit = z.infer<typeof exitSchema>
