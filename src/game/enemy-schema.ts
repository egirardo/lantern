import { z } from 'zod'
import enemiesData from './enemies.json'

export const enemyIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  message:
    'Enemy ID must be in kebab-case (lowercase letters, numbers, and hyphens)',
})

export const enemySchema = z.strictObject({
  maxHealth: z.number().int().positive(),
  armorClass: z.number().int().nonnegative(),
  initiativeBonus: z.number().int(),
  attackBonus: z.number().int(),
  damageDie: z.number().int().positive(),
  displayName: z.string().trim().min(1),
})

export const enemyTableSchema = z.record(enemyIdSchema, enemySchema)

export const enemies = enemyTableSchema.parse(enemiesData)

export type Enemy = z.infer<typeof enemySchema>
