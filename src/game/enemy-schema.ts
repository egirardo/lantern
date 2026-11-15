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
  // Optional: what the enemy looks like before a fight with it starts, e.g.
  // 'chest' for the mimic. Until then the log calls it by this name ("A chest
  // appears to the south."), because that's what a sighted player sees on the
  // canvas, so a screen reader user is fooled the same way (decided Nov 9).
  // When the fight starts it is unmasked and called by displayName.
  disguise: z.string().trim().min(1).optional(),
})

export const enemyTableSchema = z.record(enemyIdSchema, enemySchema)

export const enemies = enemyTableSchema.parse(enemiesData)

export type Enemy = z.infer<typeof enemySchema>
