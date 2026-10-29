import { z } from 'zod'
import { enemies, enemyIdSchema } from '../game/enemy-schema'
import { PLAYER_ID } from '../game/combat'

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
})

export type Room = z.infer<typeof roomSchema>
