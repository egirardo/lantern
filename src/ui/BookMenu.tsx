import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { AccountPanel } from './AccountPanel'
import { BOOK_TABS, tabForKey, type BookTab } from './book-tabs'
import { HowToPlay } from './HowToPlay'
import { SettingsForm } from './SettingsForm'

// The book menu: one modal dialog with three tabs, How to play, Settings and
// Account (mockup section 4).
//
// The dialog is a native <dialog>, opened with showModal(). That one call
// gives the hard parts of a modal for free:
// - the rest of the page becomes inert: it can't be clicked or tabbed to,
//   and screen readers don't read it, so focus stays inside the dialog;
// - it's drawn in the "top layer", above everything, with a ::backdrop;
// - Escape closes it (the browser fires `cancel`, then `close`).
// (dialog.show() would open it without any of this, as a non-modal dialog.)
//
// The tabs follow the WAI-ARIA tabs pattern: role="tablist" with role="tab"
// buttons, and one role="tabpanel" labelled by the selected tab. Only the
// selected tab is in the Tab order ("roving tabindex": tabIndex 0 on it, -1
// on the others), and the arrow keys move between tabs (see book-tabs.ts).
// So Tab goes tab → page, instead of stopping at every tab first.
//
// Who decides which tab is open: the parent (App), through `openTab`. null
// means closed. That keeps one piece of state for "is the book open, and on
// which page", which the header and start screen buttons set.
type BookMenuProps = {
  openTab: BookTab | null
  onSelectTab: (tab: BookTab) => void
  onClose: () => void
}

export function BookMenu({ openTab, onSelectTab, onClose }: BookMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // The tab buttons by id, so the arrow keys can move focus to one.
  const tabRefs = useRef<Partial<Record<BookTab, HTMLButtonElement | null>>>({})
  // The button that opened the book. Focus goes back to it on close.
  const openerRef = useRef<HTMLElement | null>(null)
  const id = useId()
  const tabId = (tab: BookTab) => `${id}-tab-${tab}`
  const panelId = `${id}-panel`

  const isOpen = openTab !== null

  // Open the dialog when the parent picks a tab, and close it when the parent
  // sets openTab to null. In an effect, because showModal() and close() need
  // the real DOM element, which only exists after React has rendered. The
  // dialog's `open` check makes both safe to run twice (StrictMode runs
  // effects twice in development): the second run finds the dialog already
  // open, or already closed, and does nothing.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!isOpen) {
      // The parent closed the book (the component's contract: the parent
      // decides). Today App only sets null in onClose, after the dialog has
      // closed, so dialog.open is already false here and nothing happens.
      // If the parent ever closes it itself, dialog.close() fires `close`
      // once, and handleClose runs as for Escape: onClose() sets null again,
      // which React ignores because the state doesn't change (so no new
      // render and no loop), and focus goes back to the opener once.
      // close() sets dialog.open to false at once, so a second run of this
      // effect can't close it twice.
      if (dialog.open) dialog.close()
      return
    }
    if (dialog.open) return

    // Remember the opener before showModal moves focus into the dialog.
    const active = document.activeElement
    openerRef.current = active instanceof HTMLElement ? active : null

    dialog.showModal()
    // showModal focuses the first focusable element (Close). Focus goes to
    // the selected tab instead, so a screen reader says where the player is:
    // "Settings, tab, selected, 2 of 3". The tabs exist already: React
    // rendered them before running this effect.
    dialog
      .querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.focus()
    // openTab isn't a dependency on purpose: switching tabs while open must
    // not run this again (the `dialog.open` check would stop it anyway).
  }, [isOpen])

  // The dialog has closed: by Escape, by the Close button, or by anything
  // else that calls dialog.close(). All of them fire `close`, so this is the
  // one place that tells the parent and gives focus back.
  function handleClose() {
    onClose()
    const opener = openerRef.current
    openerRef.current = null
    // Back to the button that opened the book. If it's gone (it can't be
    // today, but a screen could change behind the dialog), the map, so focus
    // never drops to the page body.
    if (opener && opener.isConnected) {
      opener.focus()
    } else {
      document.getElementById('phaser-game')?.focus()
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (openTab === null) return
    const next = tabForKey(openTab, event.key)
    if (next === null) return
    // Stop the arrow keys from scrolling the dialog, and Home/End from
    // jumping to its top or bottom.
    event.preventDefault()
    // Selection follows focus (the pattern's "automatic activation"): the
    // pages are already on the page, so showing them at once costs nothing.
    onSelectTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    // aria-label names the dialog, so a screen reader says "Menu, dialog"
    // as focus moves in, before the selected tab.
    <dialog
      ref={dialogRef}
      className="book-dialog"
      aria-label="Menu"
      onClose={handleClose}
    >
      {/* Only rendered while open: the Account page is a whole sign-in form,
          and there's no reason to keep it (and its auth listener) around
          while the book is shut. */}
      {openTab !== null && (
        <div className="book">
          <div className="book-side">
            {/* Close first, at the top of the side column like the mockup.
                The name is real text, hidden on screen next to the X art,
                and shown in high contrast, where the art goes away. */}
            <button
              type="button"
              className="book-close"
              onClick={() => dialogRef.current?.close()}
            >
              <span className="tab-text">Close</span>
            </button>
            <div
              role="tablist"
              aria-label="Pages"
              aria-orientation="vertical"
              className="book-tabs"
            >
              {BOOK_TABS.map((tab) => {
                const selected = tab.id === openTab
                return (
                  <button
                    key={tab.id}
                    ref={(element) => {
                      tabRefs.current[tab.id] = element
                    }}
                    id={tabId(tab.id)}
                    type="button"
                    role="tab"
                    className={`book-tab book-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => onSelectTab(tab.id)}
                    onKeyDown={handleTabKeyDown}
                  >
                    {/* The tab pieces carry their own icons (CSS
                        background). The name is text, so it's read, and
                        shown in high contrast. */}
                    <span className="tab-text">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {/* One tabpanel, labelled by the selected tab. How to play has
              nothing focusable inside, so the panel itself takes focus
              (tabIndex 0) and Tab still reaches the text from the tabs; the
              other pages start with their own controls. */}
          <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId(openTab)}
            className="book-pages"
            tabIndex={openTab === 'help' ? 0 : undefined}
          >
            {openTab === 'help' && <HowToPlay />}
            {openTab === 'settings' && <SettingsForm />}
            {openTab === 'account' && <AccountPage />}
          </div>
        </div>
      )}
    </dialog>
  )
}

// The Account pages: the account panel on the left, unchanged (it's
// self-contained), and a few words on why to sign in on the right.
function AccountPage() {
  return (
    <>
      <div className="book-page">
        <AccountPanel headingLevel={2} />
      </div>
      <div className="book-page">
        <h3>About accounts</h3>
        <p>
          You don’t need an account to play. As a guest, your progress and
          settings are saved in this browser.
        </p>
        <p>
          Signed in, they are also saved to your account, so you can go on
          playing on another device. The newest save wins.
        </p>
      </div>
    </>
  )
}
