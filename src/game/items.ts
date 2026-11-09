// Pure helpers for items lying in a room: their names, and picking them up.
// The store calls them and saves the result (like exits.ts and
// combat-flow.ts), so the rules can be tested without a store, React or
// Phaser (rule 1).

import type { LogLine } from './combat-flow'
import { items as itemTable } from './item-schema'
import { samePosition, type Position } from './movement'
import { describePickUp } from './narration'

// One item lying in the room, as the store keeps it. The same shape as an
// item in the room file ({ id, type, position }), so the store can copy the
// room's list as it is. A type of its own here (not imported from the room
// schema) for the same reason as RoomEnemy in spawn-enemies.ts: src/game/
// shouldn't depend on src/rooms/.
export type StoreItem = {
  id: string // unique in the room, e.g. 'key-1'
  type: string // a key in items.json, e.g. 'gold-key'
  position: Position
}

// The display name of an item type, e.g. 'gold-key' -> 'gold key'. Used by
// the log lines and the inventory list, so both always say the same name.
// The room schema only accepts types that are in items.json, so a missing
// one means a bug, not bad room data, and a throw makes it show up.
// The `table` parameter has a default, so normal code calls
// itemDisplayName('gold-key'), and a test can pass its own table (the same
// idea as spawnEnemies).
export function itemDisplayName(type: string, table = itemTable): string {
  const item = table[type]
  if (!item) {
    throw new Error(`Unknown item type ${type}`)
  }
  return item.displayName
}

// What picking up gives back: everything the store saves after a step.
export type PickUpResult = {
  // The items still lying in the room.
  items: StoreItem[]
  // The inventory with the picked-up types added at the end.
  inventory: string[]
  // One "You pick up a gold key." line per item, in room-file order.
  lines: LogLine[]
}

// The player stands on `position`: every item on that tile is picked up.
// - Usually there's one item or none. The room schema doesn't stop two items
//   from sharing a tile, so all of them are picked up, each with its own line,
//   instead of one being left behind under the player's feet.
// - The inventory holds item *types*, not ids (decided Nov 6): a locked exit
//   asks "does the player carry a gold-key?", not "this particular key".
// - Nothing is changed in place: filter() and the spreads build new arrays.
//   Zustand only notices a change when it gets a new array, and the Phaser
//   scene compares old and new `items` to know when to redraw.
export function pickUpItems(
  items: StoreItem[],
  position: Position,
  inventory: string[],
): PickUpResult {
  const pickedUp = items.filter((item) => samePosition(item.position, position))
  // Nothing here: return the same arrays, not copies. Then the store's
  // `items` stays the same array, and the scene sees that nothing changed.
  if (pickedUp.length === 0) {
    return { items, inventory, lines: [] }
  }

  return {
    items: items.filter((item) => !samePosition(item.position, position)),
    inventory: [...inventory, ...pickedUp.map((item) => item.type)],
    // `: LogLine` on the arrow function makes TypeScript check each line
    // against the LogLine type, so 'polite' stays the literal 'polite'
    // instead of widening to any string.
    lines: pickedUp.map((item): LogLine => ({
      text: describePickUp(itemDisplayName(item.type)),
      urgency: 'polite',
    })),
  }
}
