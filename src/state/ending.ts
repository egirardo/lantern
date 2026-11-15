import type { GameState } from './game-store'

export type Ending = 'victory' | 'defeat'

// How the game ended, or null while it goes on. One rule for everything
// that changes at the end: the end card (shown), the Actions panel (gone)
// and the Phaser scene (paused). A store selector: it returns a string or
// null, so a component using it only re-renders when the game ends.
// Escaping wins over health, though both can't happen at once: the player
// can't use the great door during a fight.
export function selectEnding(
  state: Pick<GameState, 'hasEscaped' | 'player'>,
): Ending | null {
  if (state.hasEscaped) return 'victory'
  if (state.player.currentHealth <= 0) return 'defeat'
  return null
}
