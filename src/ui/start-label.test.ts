import { describe, it, expect } from 'vitest'
import { PLAYER } from '../game/player'
import type { SaveSource } from '../save/save-rules'
import { FIRST_ROOM_ID } from '../state/game-store'
import { startButtonLabel } from './start-label'

// A store that holds a brand-new game, as a plain object (SaveSource only
// asks for the fields a save is built from).
const newGame: SaveSource = {
  currentRoomId: FIRST_ROOM_ID,
  enteredFrom: null,
  player: PLAYER,
  inventory: [],
  foundLockedExit: false,
  takenItemIds: [],
  defeatedEnemyIds: [],
}

describe('startButtonLabel', () => {
  it('says Start for a new game', () => {
    expect(startButtonLabel(newGame)).toBe('Start')
  })

  it('says Continue in another room', () => {
    expect(
      startButtonLabel({
        ...newGame,
        currentRoomId: 'dingy-basement',
        enteredFrom: 'entrance-hall',
      }),
    ).toBe('Continue')
  })

  it('says Continue after a fight in the first room', () => {
    expect(
      startButtonLabel({
        ...newGame,
        player: { ...PLAYER, currentHealth: 7 },
        defeatedEnemyIds: ['entrance-hall/skeleton-1'],
      }),
    ).toBe('Continue')
  })

  it('says Continue when the player carries something', () => {
    expect(startButtonLabel({ ...newGame, inventory: ['gold-key'] })).toBe(
      'Continue',
    )
  })

  it('says Continue when the player has found the locked door', () => {
    // In the real game that happens in another room, so the room already
    // says Continue; this checks the flag counts as progress on its own.
    expect(startButtonLabel({ ...newGame, foundLockedExit: true })).toBe(
      'Continue',
    )
  })
})
