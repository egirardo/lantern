import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { AccountPanel } from './AccountPanel'
import type { BookTab } from './book-tabs'
import { startButtonLabel } from './start-label'
import { uiAsset } from './ui-asset'

// The start screen, shown on every page load (mockup sections 2 and 2b).
// Left: the title, a short intro and the buttons. Right: the account panel.
// The game isn't on the page yet (App only renders it after Start), so
// nobody can tab or read their way into it from here.
type StartScreenProps = {
  onStart: () => void
  onOpenBook: (tab: BookTab) => void
}

export function StartScreen({ onStart, onOpenBook }: StartScreenProps) {
  // "Continue" when there's a game in progress, "Start" otherwise (see
  // start-label.ts). A string from the selector, so this only re-renders
  // when the label changes, e.g. when a sync loads a save from the account.
  const label = useStore(gameStore, startButtonLabel)
  const startRef = useRef<HTMLButtonElement>(null)

  // Start (or Continue) gets focus when the screen appears (decision 9), so
  // Enter or Space begins the game at once, and a screen reader starts on
  // the main action: "Start, button". The title and the intro are linked to
  // the button with aria-describedby (below), because focus skips past them:
  // without the link, a screen reader user would never hear them unless they
  // went back to look. The page title ("Lantern" in index.html) doesn't help
  // either: in testing (Nov 12), VoiceOver didn't read it on load, because
  // focus moving here at once takes over the announcement.
  useEffect(() => {
    startRef.current?.focus()
  }, [])

  return (
    <div className="start-screen">
      <div className="start-intro">
        {/* The ids let the Start button point to the title and the intro
            (aria-describedby). */}
        <h1 id="start-title" className="start-title">
          Lantern
        </h1>
        <p id="start-intro-text">
          You wake in a dark dungeon with only a lantern. It’s up to you to find
          the way out.
        </p>
        {/* A list, so a screen reader says how many choices there are. */}
        {/* role="list" looks redundant, but Safari drops the list
            semantics of a list styled with list-style: none (.plain-list),
            and VoiceOver then doesn't say "list, n items". */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
        <ul className="plain-list start-actions" role="list">
          <li>
            {/* aria-describedby adds the title and the intro, in that
                order, as the button's description: VoiceOver reads the name
                first ("Start, button"), then "Lantern. You wake in…" after
                a short pause. The name stays short, so
                the button is still easy to find in a list of buttons. */}
            <button
              ref={startRef}
              type="button"
              className="btn"
              aria-describedby="start-title start-intro-text"
              onClick={onStart}
            >
              <img className="icon" src={uiAsset('icon-start.png')} alt="" />
              {label}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenBook('help')}
            >
              <img className="icon" src={uiAsset('icon-help.png')} alt="" />
              How to play
            </button>
          </li>
          <li>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenBook('settings')}
            >
              <img className="icon" src={uiAsset('icon-settings.png')} alt="" />
              Settings
            </button>
          </li>
        </ul>
      </div>
      {/* The divider between the halves is decoration only. */}
      <div className="start-divider" aria-hidden="true" />
      <div className="panel-dark start-account">
        <AccountPanel headingLevel={2} />
      </div>
    </div>
  )
}
