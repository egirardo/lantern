import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { LiveAnnouncer } from './LiveAnnouncer'

export function AdventureLog() {
  const log = useStore(gameStore, (state) => state.log)
  const entriesRef = useRef<HTMLDivElement>(null)

  // The entries box scrolls, so new lines would land below the visible area.
  // After every new entry, jump to the bottom so the newest line is in view.
  // Setting scrollTop jumps instantly (no smooth scrolling), so there's no
  // motion to switch off for reduced motion.
  useEffect(() => {
    const entries = entriesRef.current
    if (entries) {
      entries.scrollTop = entries.scrollHeight
    }
  }, [log])

  return (
    // The wrapper only exists for the layout: the heading stays at the top,
    // and only the entries box below it scrolls.
    <div className="adventure-log">
      <h2 id="adventure-log">Adventure log</h2>
      {/* The visible log is a named region, not a live region: LiveAnnouncer
          reads new lines aloud, so nothing is announced twice. Screen reader
          users can still jump here ("Adventure log") and read back.
          tabIndex={0}: a scrollable box must be reachable with the keyboard,
          so keyboard users can focus it and scroll with the arrow keys
          (WCAG 2.1.1; axe checks this as "scrollable-region-focusable").
          Safari doesn't make scrollable boxes focusable on its own. */}
      <div
        ref={entriesRef}
        className="adventure-log-entries"
        role="region"
        aria-labelledby="adventure-log"
        // The rule doesn't know about scrollable boxes, which must be focusable
        // (see the comment above), so it's turned off for this line only.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <ol>
          {log.map((entry) => (
            <li key={entry.id}>{entry.text}</li>
          ))}
        </ol>
      </div>
      <LiveAnnouncer />
    </div>
  )
}
