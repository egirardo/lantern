import { describe, it, expect } from 'vitest'
import { animationKey, facingAfterStep, isSingleStep } from './sprite-motion'

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
