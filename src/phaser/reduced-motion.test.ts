import { describe, it, expect, afterEach } from 'vitest'
import { prefersReducedMotion } from './reduced-motion'
import { gameStore } from '../state/game-store'

// prefersReducedMotion reads the shared store (the one Phaser uses), so each
// test puts the setting back afterwards. Otherwise one test's setting would
// leak into the next.
const startSetting = gameStore.getState().settings.reducedMotion

afterEach(() => {
  gameStore.getState().updateSettings({ reducedMotion: startSetting })
})

describe('prefersReducedMotion', () => {
  it('is true when the setting in the store is on', () => {
    gameStore.getState().updateSettings({ reducedMotion: true })
    expect(prefersReducedMotion()).toBe(true)
  })

  it('is false when the setting in the store is off', () => {
    gameStore.getState().updateSettings({ reducedMotion: false })
    expect(prefersReducedMotion()).toBe(false)
  })
})
