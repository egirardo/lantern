import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import type { Settings } from './settings'
import { validMap, validRoom } from '../rooms/testing-map'

const startSettings: Settings = {
  reducedMotion: true,
  highContrast: false,
  textSize: 'normal',
  logVerbosity: 'verbose',
}

describe('game store settings', () => {
  it('starts with the settings it is given', () => {
    const store = createGameStore(Math.random, startSettings)
    expect(store.getState().settings).toEqual(startSettings)
  })

  it('starts without reduced motion in Node, where there is no window', () => {
    // The default reads the operating system setting, and osPrefersReducedMotion
    // says false when there's no window to ask.
    const store = createGameStore()
    expect(store.getState().settings.reducedMotion).toBe(false)
  })

  it('changes only the settings passed to updateSettings', () => {
    const store = createGameStore(Math.random, startSettings)
    store.getState().updateSettings({ highContrast: true, textSize: 'larger' })
    expect(store.getState().settings).toEqual({
      ...startSettings,
      highContrast: true,
      textSize: 'larger',
    })
  })

  it('throws on a setting that is undefined, and keeps the old settings', () => {
    const store = createGameStore(Math.random, startSettings)
    expect(() =>
      store.getState().updateSettings({ highContrast: undefined }),
    ).toThrow()
    expect(store.getState().settings).toEqual(startSettings)
  })

  it('keeps the settings when a room is loaded', () => {
    const store = createGameStore(Math.random, startSettings)
    store.getState().updateSettings({ logVerbosity: 'brief' })
    store.getState().loadRoom(validRoom, validMap)
    expect(store.getState().settings.logVerbosity).toBe('brief')
  })
})
