import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'

export function AdventureLog() {
  const log = useStore(gameStore, (state) => state.log)

  return (
    <>
      <h2 id="adventure-log">Adventure log</h2>
      <ol aria-labelledby="adventure-log">
        {log.map((entry) => (
          <li key={entry.id}>{entry.text}</li>
        ))}
      </ol>
    </>
  )
}
