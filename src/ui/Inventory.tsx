import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { itemDisplayName } from '../game/items'
import { ItemSprite } from './ItemSprite'

// "gold key" -> "Gold key": a list entry starts with a capital, like the
// mockup. Not CSS text-transform: capitalize, which would make "Gold Key".
function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The items the player carries, as a plain list (decision 8). Semantic HTML
// only, with nothing to press:
// - No focus moves and nothing focusable, so it doesn't change the Tab order.
// - No live region: the log already announces every pickup ("You pick up a
//   gold key."), so announcing the list too would say it twice.
// - aria-labelledby names the section with its heading, which makes it a
//   landmark ("Inventory, region"), so a screen reader user can jump to it
//   and check what they carry, like the combat menu and the log.
// - Each item is its sprite (decoration, aria-hidden) and its name. The small
//   diamond in front is drawn in CSS (::before), so it isn't read either.
export function Inventory() {
  // The inventory array from the store. The store makes a new array only when
  // something is picked up, so this re-renders only then, not on every step.
  const inventory = useStore(gameStore, (state) => state.inventory)

  return (
    <section
      aria-labelledby="inventory-heading"
      className="panel-dark inventory"
    >
      <h2 id="inventory-heading" className="banner">
        Inventory
      </h2>
      {/* "Nothing yet." as a sentence instead of an empty list: a <ul> with
          no items would be read as "list, 0 items" or skipped, which says
          less. */}
      {inventory.length === 0 ? (
        <p className="inventory-empty">Nothing yet.</p>
      ) : (
        <>
          {/* role="list" looks redundant, but Safari drops the list
              semantics of a list styled with list-style: none (.plain-list),
              and VoiceOver then doesn't say "list, n items". */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul className="plain-list inventory-list" role="list">
            {inventory.map((type, index) => (
              // The index is part of the key because the list holds types, and
              // two items of the same type (two keys) would share a key. That's
              // safe here: items are only added at the end, never reordered.
              <li key={`${index}-${type}`}>
                <ItemSprite type={type} />
                <span>{sentenceCase(itemDisplayName(type))}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
