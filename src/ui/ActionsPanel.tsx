import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { selectEnding } from '../state/ending'
import { gameStore } from '../state/game-store'
import { getAttackOptions } from '../game/narration'
import { ExitButton } from './ExitButton'
import { selectExitLabel } from './exit-label'

// How long to wait before moving focus into the menu at the start of a fight.
// VoiceOver lost track when focus moved in the same moment the page changed
// (it read "main" instead of the button). With a short wait, it reads the
// button, then the queued log lines ("The demon attacks you!…"). Tested with
// VoiceOver in Safari, Nov 3.
const FOCUS_DELAY_MS = 100

// Focus whatever had focus before the fight (normally the map), or the map
// if that element is gone. document.body counts as "nowhere": it's an
// HTMLElement and always on the page, but focusing it doesn't help.
function returnFocus(previousFocus: HTMLElement | null) {
  if (
    previousFocus &&
    previousFocus.isConnected &&
    previousFocus !== document.body
  ) {
    previousFocus.focus()
  } else {
    document.getElementById('phaser-game')?.focus()
  }
}

// The Actions panel (decided Nov 13, renamed from Your turn): what the
// player can do right now, as buttons. In a fight, one attack button per
// enemy; next to an exit, the exit button; otherwise "Nothing to do here.".
// At the end of the game it's gone, and the end card takes its place.
// The heading is always "Actions", so a screen reader user finds it under
// one name; the log says "It's your turn." in a fight.
export function ActionsPanel() {
  const combat = useStore(gameStore, (state) => state.combat)
  // At the end of the game the panel is gone (the end card covers the map
  // instead, see EndCard.tsx).
  const gameOver = useStore(gameStore, selectEnding) !== null
  // The exit button's label, or null when there's no exit next to the
  // player (or a fight is on). A string, so this only re-renders when it
  // changes.
  const exitLabel = useStore(gameStore, selectExitLabel)
  const menuRef = useRef<HTMLElement>(null)
  // What had focus when the fight started. A ref instead of a variable inside
  // the effect, because the click handler needs it too, at the end of the
  // fight. Changing a ref doesn't re-render.
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const inFight = combat !== null

  // The fight starts: remember what has focus (normally the map), then move
  // focus to the first attack button after a short wait.
  useEffect(() => {
    if (!inFight) return

    const current = document.activeElement
    previousFocusRef.current = current instanceof HTMLElement ? current : null

    const timeoutId = setTimeout(() => {
      menuRef.current?.querySelector('button')?.focus()
    }, FOCUS_DELAY_MS)

    return () => {
      // The fight has ended. Cancel the timer in case it ended before the
      // timer fired.
      clearTimeout(timeoutId)
      // Normally the click handler has already moved focus (see attack
      // below). This is a safety net: if focus was lost anyway, give it back.
      if (document.activeElement === document.body) {
        returnFocus(previousFocusRef.current)
      }
    }
  }, [inFight])

  // The player attacks. Focus must never be on a button that disappears:
  // VoiceOver then moves its own cursor to "main", announces that, and drops
  // the queued log lines (the victory lines were never read, Nov 3).
  // playerAttack updates the store right away, so the result can be read on
  // the next line. React only re-renders (and removes buttons) after this
  // handler has finished, so the old buttons are still on the page here.
  function attack(targetId: string) {
    gameStore.getState().playerAttack(targetId)
    const after = gameStore.getState().combat

    if (after === null) {
      // The fight is over, won or lost. Move focus to the map now, while the
      // button still exists. VoiceOver reads the map, then the queued lines.
      // On a loss, those lines end with the game over message. Focus doesn't
      // go to GameOver's message: it doesn't exist yet at this point, and
      // moving focus there afterwards made VoiceOver drop the last batch of
      // lines (tested Nov 4).
      returnFocus(previousFocusRef.current)
      return
    }

    // The fight goes on. If the target died, its button is about to vanish,
    // so move focus to the button of the first enemy still standing. That
    // button exists already and stays. If the target survived, focus stays
    // where it is, on the enemy you were fighting.
    const options = getAttackOptions(after)
    const targetSurvived = options.some((option) => option.id === targetId)
    // options[0] is `AttackOption | undefined` to TypeScript (an array can be
    // empty), so it gets a name and a check instead of a ! assertion.
    const firstStanding = options[0]
    if (!targetSurvived && firstStanding) {
      menuRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-enemy-id="${firstStanding.id}"]`,
        )
        ?.focus()
    }
  }

  if (gameOver) {
    return null
  }

  // No fight: the exit button when the player stands next to an exit.
  // Otherwise a dashed box where the buttons go (decided Nov 12), with a
  // line of text, so a screen reader user who finds the "Actions" heading
  // also hears why there's nothing to press, instead of a heading with
  // nothing under it. The heading id is the same in every case, so the
  // section keeps its name.
  if (!combat) {
    return (
      <section
        aria-labelledby="actions-heading"
        className="panel-dark actions-panel"
      >
        <h2 id="actions-heading" className="banner">
          Actions
        </h2>
        {exitLabel === null ? (
          <p className="actions-empty">Nothing to do here.</p>
        ) : (
          <div className="actions-options">
            <ExitButton label={exitLabel} />
          </div>
        )}
      </section>
    )
  }

  const options = getAttackOptions(combat)

  return (
    <section
      ref={menuRef}
      aria-labelledby="actions-heading"
      className="panel-dark actions-panel"
    >
      <h2 id="actions-heading" className="banner">
        Actions
      </h2>
      {/* role="list" looks redundant, but Safari drops the list
          semantics of a list styled with list-style: none (.plain-list),
          and VoiceOver then doesn't say "list, n items". */}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul className="plain-list actions-options" role="list">
        {options.map((option) => (
          <li key={option.id}>
            {/* data-enemy-id lets attack() find this button by enemy id. */}
            <button
              type="button"
              className="btn"
              data-enemy-id={option.id}
              onClick={() => attack(option.id)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
