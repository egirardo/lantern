import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { uiAsset } from './ui-asset'

// The end of the game, won or lost: one card for both (it replaces the old
// GameOver and Victory messages). It appears where the combat menu was.
//
// It doesn't take focus (decided Nov 3–6, path A). At the end, the last log
// lines are still being read ("Defeat. Game over…", "Victory! You climb
// out…"), and moving focus here made VoiceOver drop them (tested Nov 4). So
// focus stays where it is (ActionsPanel puts it on the map after the last
// attack), and the player tabs to Play again when ready. There's no time
// limit.
export function EndCard() {
  // 'victory', 'defeat' or null while the game goes on. One string, so the
  // card only re-renders when the game ends.
  const ending = useStore(gameStore, (s) => {
    if (s.hasEscaped) return 'victory'
    if (s.player.currentHealth <= 0) return 'defeat'
    return null
  })
  const defeatedCount = useStore(gameStore, (s) => s.defeatedEnemyIds.length)
  const health = useStore(gameStore, (s) => s.player.currentHealth)
  const maxHealth = useStore(gameStore, (s) => s.player.maxHealth)

  if (ending === null) return null

  const isVictory = ending === 'victory'

  // Play again reloads the page. When the game ended, the save code
  // (src/save/sync.ts) stored an "ended" save, so the next page load starts
  // a new game, and the player lands on the start screen like on any visit.
  // A reload is the simplest way to start clean: the store, the Phaser game
  // and every component begin from scratch, with no old state to reset by
  // hand (and nothing that could be forgotten).
  function playAgain() {
    window.location.reload()
  }

  return (
    <section aria-labelledby="end-heading" className="panel-light end-card">
      <h2 id="end-heading">{isVictory ? 'Victory' : 'Game over'}</h2>
      <p>
        {isVictory ? 'You climbed out of the dungeon.' : 'You have fallen.'}
      </p>
      {/* Health is never below 0 in the summary, even if the last hit was
          bigger than what was left. */}
      <p className="end-stats">
        Enemies defeated: {defeatedCount}. Health left: {Math.max(0, health)} /{' '}
        {maxHealth}.
      </p>
      <button type="button" className="btn" onClick={playAgain}>
        <img className="icon" src={uiAsset('icon-play-again.png')} alt="" />
        Play again
      </button>
    </section>
  )
}
