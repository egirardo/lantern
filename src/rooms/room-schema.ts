import { z } from 'zod'

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
})

export type Room = z.infer<typeof roomSchema>
