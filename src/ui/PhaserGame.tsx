import { useEffect, useRef, type KeyboardEvent } from 'react'
import { createGame } from '../phaser/create-game'
import { keyToDirection } from './key-to-direction'
import { gameStore } from '../state/game-store'

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    // Enter uses the exit next to the player. The store decides whether
    // there is one, and logs a line either way.
    if (event.key === 'Enter') {
      // Same as the arrow keys: a held Enter is one action, not many.
      if (event.repeat) return
      gameStore.getState().takeExit()
      return
    }

    const direction = keyToDirection(event.key)
    if (!direction) {
      return
    }

    // Prevent the arrow keys from scrolling the page.
    event.preventDefault()

    // One key press is one turn. Ignoring repeats keeps a held key from flooding the log
    if (event.repeat) return

    gameStore.getState().movePlayer(direction)
  }

  useEffect(() => {
    if (!containerRef.current) return

    const game = createGame(containerRef.current)

    // StrictMode mounts, unmounts and remounts in development. Without this
    // cleanup, the first game would never be destroyed and two canvases would appear.
    return () => {
      game.destroy(true)
    }
  }, [])

  return (
    <>
      <p>Use the arrow keys to move.</p>
      <div
        id="phaser-game"
        ref={containerRef}
        role="application"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Dungeon map. Use the arrow keys to move."
      />
    </>
  )
}
