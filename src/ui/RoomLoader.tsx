import { useState, useEffect, useRef } from 'react'
import { fetchRoomFiles } from '../rooms/fetch-room-files'
import { gameStore } from '../state/game-store'

type LoadStatus =
  { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; message: string }

export function RoomLoader({ roomId }: { roomId: string }) {
  const [status, setStatus] = useState<LoadStatus>({ kind: 'loading' })
  // A ref gives us the real DOM element, so we can call .focus() on it.
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const { roomData, mapData } = await fetchRoomFiles(roomId)
        if (ignore) return
        gameStore.getState().loadRoom(roomData, mapData)
        setStatus({ kind: 'ready' })
      } catch (error) {
        console.error(error)
        if (!ignore) {
          setStatus({
            kind: 'error',
            message: "The room couldn't be loaded. Try reloading the page.",
          })
        }
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [roomId])

  // Focus moves to the error instead of using a live region (role="alert"):
  // VoiceOver in Safari didn't announce a live region that changed during page
  // load. A screen reader always reads what gets focus, no matter the timing.
  // Moving focus is fine here because the error is blocking: there's no game
  // to take focus from.
  // Known issue: VoiceOver also reads the page from the top on load, so if the
  // error is already there, it's read twice. Kept on purpose: twice is better
  // than never, which can happen on a slow connection without the focus move.
  useEffect(() => {
    if (status.kind === 'error') {
      errorRef.current?.focus()
    }
  }, [status.kind])

  return (
    <>
      <div role="status">
        {status.kind === 'loading' ? 'Loading the room…' : ''}
      </div>
      {/* tabIndex={-1} makes the div focusable by code, without adding it to the Tab order */}
      <div ref={errorRef} tabIndex={-1}>
        {status.kind === 'error' ? status.message : ''}
      </div>
    </>
  )
}
