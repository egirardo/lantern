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

// How long a batch stays in the hidden regions before it's cleared. Long
// enough for VoiceOver to finish reading a long batch (removing the text
// while it's being read could cut it off). 7 seconds is also React Aria's
// default for its announcer.
const CLEAR_AFTER_MS = 7000

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
    // invisible non-breaking space, which VoiceOver doesn't read, so two
    // batches in a row are never identical.
    //
    // The space goes on every line, not only the last: VoiceOver compares
    // each line (<p>) on its own. Two natural 1s in a row start two batches
    // with the same line ("You roll a natural 1 and miss the demon!"), and
    // the second one was skipped while only the last line had the space
    // (tested Nov 4).
    let addSpace = false

    return gameStore.subscribe((state, previous) => {
      if (state.log === previous.log) return
      const added = state.log.slice(previous.log.length)
      const first = added[0]
      if (!first) return

      addSpace = !addSpace
      // map makes new strings, so this doesn't change the store's entries.
      const lines = added.map((entry) =>
        addSpace ? entry.text + '\u00A0' : entry.text,
      )

      setBatch({
        key: first.id,
        urgency: added.some((entry) => entry.urgency === 'assertive')
          ? 'assertive'
          : 'polite',
        lines,
      })
    })
  }, [])

  // Clear the batch a while after it appears. The hidden copy is only for
  // announcing: left on the page, a screen reader reading in order (VO + right
  // arrow, or VoiceOver reading the page on load) reached the newest lines a
  // second time, right after the visible log (tested Nov 4). Removing text is
  // silent: live regions announce additions, not removals.
  // A new batch runs the cleanup first, which cancels the old timer, so the
  // newest batch always gets its full time.
  useEffect(() => {
    if (!batch) return
    const timeoutId = setTimeout(() => setBatch(null), CLEAR_AFTER_MS)
    return () => clearTimeout(timeoutId)
  }, [batch])

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
