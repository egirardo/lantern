import { useEffect, useId, useRef } from 'react'
import { createGame } from '../phaser/create-game'

export function PhaserGame() {
  const hintId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

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
      <p id={hintId}>Use the arrow keys to move.</p>
      <div
        id="phaser-game"
        ref={containerRef}
        role="application"
        tabIndex={0}
        aria-label="Dungeon map"
        aria-describedby={hintId}
      />
    </>
  )
}
