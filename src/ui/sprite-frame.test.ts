import { describe, it, expect } from 'vitest'
import { frameStyle, stillFrameName } from './sprite-frame'

describe('stillFrameName', () => {
  it('is the first idle frame of the sprite', () => {
    expect(stillFrameName('gold-key')).toBe('gold-key-0')
  })

  it('uses the sprite’s own prefix', () => {
    expect(stillFrameName('skeleton')).toBe('skeleton-0')
  })
})

describe('frameStyle', () => {
  const sheet = { w: 1024, h: 1024 }

  it('makes the box the frame’s size times the scale', () => {
    const style = frameStyle({ x: 352, y: 320, w: 16, h: 16 }, sheet, 3)
    expect(style.width).toBe('48px')
    expect(style.height).toBe('48px')
  })

  it('scales the whole sheet and moves it so the frame is in the corner', () => {
    const style = frameStyle({ x: 352, y: 320, w: 16, h: 16 }, sheet, 3)
    expect(style.backgroundSize).toBe('3072px 3072px')
    expect(style.backgroundPosition).toBe('-1056px -960px')
  })

  it('keeps tall frames tall', () => {
    const style = frameStyle({ x: 0, y: 0, w: 16, h: 32 }, sheet, 2)
    expect(style.width).toBe('32px')
    expect(style.height).toBe('64px')
  })
})
