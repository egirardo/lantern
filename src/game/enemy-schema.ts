import { z } from 'zod'
import { kebabCaseSchema } from './kebab-case-schema'
import enemiesData from './enemies.json'

export const enemyIdSchema = kebabCaseSchema('Enemy ID')

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
