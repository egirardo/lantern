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

export const roomSchema = z.strictObject({
  id: roomIdSchema,
  name: z.string().trim().min(1),
  map: z.string().trim().min(1),
  playerStart: positionSchema,
  description: z.string().trim().min(1),
  exits: z.array(
    z.strictObject({
      tiles: z.array(positionSchema).min(1),
      to: roomIdSchema,
    }),
  ),
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
