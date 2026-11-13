import { useStore } from 'zustand'
import { selectEnding } from '../state/ending'
import { gameStore } from '../state/game-store'
import { uiAsset } from './ui-asset'

// The end of the game, won or lost: one card for both. It covers the map
// (decided Nov 13), on a dark see-through backdrop, so the result is where
// the player is looking, and the scene under it stops moving (RoomScene
// pauses). It's the same card for the eye and for a screen reader, not a
// second copy: in the page it comes right after the map, outside the map's
// role="application" element, so it's read as normal content and Tab from
// the map goes straight to Play again. In one column (narrow windows, zoom)
// it sits under the map instead (game.css).
//
// It doesn't take focus (decided Nov 3–6, path A). At the end, the last log
// lines are still being read ("Defeat. Game over…", "Victory! You climb
// out…"), and moving focus here made VoiceOver drop them (tested Nov 4). So
// focus stays where it is (ActionsPanel puts it on the map after the last
// attack), and the player tabs to Play again when ready. There's no time
// limit.
export function EndCard() {
  // 'victory', 'defeat' or null while the game goes on.
  const ending = useStore(gameStore, selectEnding)
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
    // The backdrop is only a frame for the card: no role, no text.
    <div className="end-overlay">
      <section aria-labelledby="end-heading" className="panel-light end-card">
        <h2 id="end-heading">{isVictory ? 'Victory' : 'Game over'}</h2>
        <p>
          {isVictory ? 'You climbed out of the dungeon.' : 'You have fallen.'}
        </p>
        {/* Health is never below 0 in the summary, even if the last hit was
          bigger than what was left. */}
        <p className="end-stats">
          Enemies defeated: {defeatedCount}. Health left: {Math.max(0, health)}{' '}
          / {maxHealth}.
        </p>
        <button type="button" className="btn" onClick={playAgain}>
          <img className="icon" src={uiAsset('icon-play-again.png')} alt="" />
          Play again
        </button>
      </section>
    </div>
  )
}
