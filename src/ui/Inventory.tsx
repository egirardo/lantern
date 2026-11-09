import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { itemDisplayName } from '../game/items'

// The items the player carries, as a plain list (decision 8). Semantic HTML
// only, with nothing to press:
// - No focus moves and nothing focusable, so it doesn't change the Tab order.
// - No live region: the log already announces every pickup ("You pick up a
//   gold key."), so announcing the list too would say it twice.
// - aria-labelledby names the section with its heading, which makes it a
//   landmark ("Inventory, region"), so a screen reader user can jump to it
//   and check what they carry, like the combat menu and the log.
export function Inventory() {
  // The inventory array from the store. The store makes a new array only when
  // something is picked up, so this re-renders only then, not on every step.
  const inventory = useStore(gameStore, (state) => state.inventory)

  return (
    <section aria-labelledby="inventory-heading" className="inventory">
      <h2 id="inventory-heading">Inventory</h2>
      {/* "Empty" as a sentence instead of an empty list: a <ul> with no items
          would be read as "list, 0 items" or skipped, which says less. */}
      {inventory.length === 0 ? (
        <p>Empty</p>
      ) : (
        <ul>
          {inventory.map((type, index) => (
            // The index is part of the key because the list holds types, and
            // two items of the same type (two keys) would share a key. That's
            // safe here: items are only added at the end, never reordered.
            <li key={`${index}-${type}`}>{itemDisplayName(type)}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
