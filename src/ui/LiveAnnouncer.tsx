import { useEffect, useState } from 'react'
import { gameStore } from '../state/game-store'

// The newest batch of log lines: everything one store update added, e.g. an
// attack, the enemy's reply and "It's your turn.". `key` is the id of the
// batch's first entry, so every batch is a new element (see below).
// `urgency` is the urgency of the whole batch (see setBatch below).
type Batch = {
  key: string
  urgency: 'polite' | 'assertive'
  lines: string[]
}

// Reads new log lines aloud for screen readers. The visible adventure log is
// a plain list for reading and browsing back; this does the announcing.
//
// Why not make the visible log the live region? It was one (role="log"), but
// VoiceOver in Safari stopped announcing it after about 16 lines, every time,
// no matter which enemy or how the box scrolled (tested Nov 3). Live regions
// that keep growing are the least reliable kind. An announcer that only ever
// holds the newest batch, replaced on every update, is the pattern that works
// best across screen readers (React Aria's LiveAnnouncer works the same way).
//
// Two regions, because one live region has one politeness level: normal
// events are polite (they wait for a pause), and only urgent ones like low
// health are assertive (they interrupt).
//
// A batch is as urgent as its most urgent line, and the whole batch goes to
// one region, in order. Splitting it didn't work: the assertive low-health
// line interrupted VoiceOver, and the polite lines queued before it (the hit
// that caused the low health) were never read (tested Nov 3).
export function LiveAnnouncer() {
  const [batch, setBatch] = useState<Batch | null>(null)

  // Listen to the store directly instead of with useStore: subscribe gives
  // both the new and the previous state, so the new lines are simply the end
  // of the log that the previous state didn't have. The log only ever grows
  // (every action appends), so slicing at the old length is enough.
  // subscribe returns the unsubscribe function, which is also the effect's
  // cleanup, so StrictMode's mount, unmount, mount in dev is handled.
  useEffect(() => {
    // Flips on every batch. VoiceOver skips an announcement whose text is the
    // same as the one before, even in a new element, so walking into a wall
    // twice was only read once (tested Nov 3). Every other batch gets an
    // invisible non-breaking space at the end, which VoiceOver doesn't read,
    // so two batches in a row are never identical.
    let addSpace = false

    return gameStore.subscribe((state, previous) => {
      if (state.log === previous.log) return
      const added = state.log.slice(previous.log.length)
      const first = added[0]
      if (!first) return

      addSpace = !addSpace
      const lines = added.map((entry) => entry.text)
      if (addSpace) {
        // The last line gets the space. `lines` is a new array from map, so
        // this doesn't change the store's entries.
        lines[lines.length - 1] += '\u00A0'
      }

      setBatch({
        key: first.id,
        urgency: added.some((entry) => entry.urgency === 'assertive')
          ? 'assertive'
          : 'polite',
        lines,
      })
    })
  }, [])

  // Both regions are always on the page, even when empty: a live region must
  // exist before its text changes, or screen readers miss the first message.
  //
  // key={batch.key} makes React replace BatchLines on every batch instead of
  // reusing it. A new element is a clear "something was added" for the
  // screen reader, even when the text is the same as last time (walking into
  // a wall twice must be announced twice). The key goes here, where
  // BatchLines is used: React compares keys in the parent, so a key on the
  // root element inside BatchLines would do nothing.
  return (
    <div className="visually-hidden">
      <div aria-live="polite">
        {batch?.urgency === 'polite' && (
          <BatchLines key={batch.key} batch={batch} />
        )}
      </div>
      <div aria-live="assertive">
        {batch?.urgency === 'assertive' && (
          <BatchLines key={batch.key} batch={batch} />
        )}
      </div>
    </div>
  )
}

// The lines of one batch, in order.
function BatchLines({ batch }: { batch: Batch }) {
  return (
    <div>
      {batch.lines.map((text, index) => (
        // The index is fine as a key here: this list is thrown away and
        // rebuilt for every batch, never reordered.
        <p key={index}>{text}</p>
      ))}
    </div>
  )
}
