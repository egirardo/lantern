// The book menu's tabs, in order, and the keyboard rule for moving between
// them. Kept apart from BookMenu.tsx so the rule is a pure function with
// tests, like the helpers in src/game/.

export type BookTab = 'help' | 'settings' | 'account'

export const BOOK_TABS: readonly { id: BookTab; label: string }[] = [
  { id: 'help', label: 'How to play' },
  { id: 'settings', label: 'Settings' },
  { id: 'account', label: 'Account' },
]

// Which tab a key moves to from `current`, or null for a key the tabs don't
// handle (Tab, letters…), which then does what it normally does.
// The WAI-ARIA tabs pattern for a vertical tablist: Down and Up move to the
// next and previous tab, wrapping around at the ends; Home and End go to the
// first and last. Right and Left do the same as Down and Up, because in a
// narrow window the tabs are shown in a row, where those are the arrows a
// player would try.
export function tabForKey(current: BookTab, key: string): BookTab | null {
  const index = BOOK_TABS.findIndex((tab) => tab.id === current)
  const last = BOOK_TABS.length - 1
  let next: number
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      next = index === last ? 0 : index + 1
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      next = index === 0 ? last : index - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return null
  }
  // BOOK_TABS[next] is `… | undefined` to TypeScript (an index can be out of
  // range); it never is here, but the check keeps the type honest.
  return BOOK_TABS[next]?.id ?? null
}
