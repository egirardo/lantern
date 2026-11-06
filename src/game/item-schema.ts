import { z } from 'zod'
import itemsData from './items.json'

// The same rule as enemy and room ids: kebab-case, e.g. 'rusty-key'.
// Used both for the keys of items.json (the item types) and for the ids of
// the items placed in a room (e.g. 'key-1').
export const itemIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  message:
    'Item ID must be in kebab-case (lowercase letters, numbers, and hyphens)',
})

// One item type. Only a name for now: the log needs it ("You unlock the door
// with the rusty key."). New fields (e.g. how much a potion heals) go here
// when an item needs them. strictObject rejects unknown fields, so a typo
// like "displayname" is an error instead of a silently missing name.
export const itemSchema = z.strictObject({
  displayName: z.string().trim().min(1),
})

// The whole table: item type -> item. Works like enemyTableSchema.
export const itemTableSchema = z.record(itemIdSchema, itemSchema)

// Parsed once when the file is first imported, so a broken items.json fails
// straight away (in the tests and on page load) instead of in the middle of
// a game.
export const items = itemTableSchema.parse(itemsData)

export type Item = z.infer<typeof itemSchema>

// True if `type` is a key in items.json. Object.hasOwn instead of `in`,
// because `in` also finds names every object inherits, like 'toString'.
export function isItemType(type: string): boolean {
  return Object.hasOwn(items, type)
}
