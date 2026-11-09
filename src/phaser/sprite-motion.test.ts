import { describe, it, expect } from 'vitest'
import {
  animationKey,
  enemyAnimationName,
  facingAfterStep,
  isSingleStep,
} from './sprite-motion'
import { SPRITES } from '../assets/manifest'

describe('enemyAnimationName', () => {
  it('keeps a disguised mimic on its still idle frame', () => {
    expect(enemyAnimationName(true, SPRITES.mimic.animations)).toBe('idle')
  })

  it('plays the unmasked loop once the mimic is no longer disguised', () => {
    expect(enemyAnimationName(false, SPRITES.mimic.animations)).toBe('unmasked')
  })

  it('gives an enemy without an unmasked animation its idle loop', () => {
    expect(enemyAnimationName(false, SPRITES.skeleton.animations)).toBe('idle')
  })
})

describe('the mimic in the manifest', () => {
  // Before a fight it must look like a plain chest: one closed frame, so
  // there is no movement to give it away.
  it('stands still as a closed chest while disguised', () => {
    expect(SPRITES.mimic.animations.idle.frames).toEqual([0])
  })

  // The first frame is what reduced motion shows, so it must be an open
  // mouth, not the closed chest: otherwise the unmasking can't be seen.
  it('opens its mouth from the first frame of the unmasked loop', () => {
    expect(SPRITES.mimic.animations.unmasked.frames[0]).not.toBe(0)
  })
})

describe('animationKey', () => {
  it('joins the sprite name and the animation name', () => {
    expect(animationKey('hero-girl', 'idle')).toBe('hero-girl-idle')
    expect(animationKey('skeleton', 'run')).toBe('skeleton-run')
  })
})

describe('facingAfterStep', () => {
  const start = { x: 3, y: 3 }

  it('faces right after a step east', () => {
    expect(facingAfterStep(start, { x: 4, y: 3 }, 'left')).toBe('right')
  })

  it('faces left after a step west', () => {
    expect(facingAfterStep(start, { x: 2, y: 3 }, 'right')).toBe('left')
  })

  it('keeps the current facing after a step north or south', () => {
    expect(facingAfterStep(start, { x: 3, y: 2 }, 'left')).toBe('left')
    expect(facingAfterStep(start, { x: 3, y: 4 }, 'right')).toBe('right')
  })

  it('keeps the current facing when the position did not change', () => {
    expect(facingAfterStep(start, { x: 3, y: 3 }, 'left')).toBe('left')
  })
})

describe('isSingleStep', () => {
  const start = { x: 3, y: 3 }

  it('is true for one tile in each of the four directions', () => {
    expect(isSingleStep(start, { x: 3, y: 2 })).toBe(true)
    expect(isSingleStep(start, { x: 3, y: 4 })).toBe(true)
    expect(isSingleStep(start, { x: 4, y: 3 })).toBe(true)
    expect(isSingleStep(start, { x: 2, y: 3 })).toBe(true)
  })

  it('is false for the same tile (a blocked move)', () => {
    expect(isSingleStep(start, { x: 3, y: 3 })).toBe(false)
  })

  it('is false for a diagonal or a longer jump', () => {
    expect(isSingleStep(start, { x: 4, y: 4 })).toBe(false)
    expect(isSingleStep(start, { x: 5, y: 3 })).toBe(false)
  })
})
