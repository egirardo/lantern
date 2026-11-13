import { gameStore } from '../state/game-store'

// The one place that decides whether sprites may move on their own (idle
// loops, walking frames, sliding between tiles and the hit flash). Every
// animation asks this function right before it starts, so there is a single
// switch to change.
//
// It reads the player's own setting from the store (Phase L), not the media
// query: the setting starts from the operating system's "Reduce motion"
// (see defaultSettings), but the player can change it in the game. It is
// read again on every call, so a change applies to the next animation that
// starts. room-scene.ts also restarts or stops the idle loops at once when
// the setting changes, so the player doesn't have to take a step first.
export function prefersReducedMotion(): boolean {
  return gameStore.getState().settings.reducedMotion
}
