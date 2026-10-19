import { describe, it, expect } from 'vitest'
import { describeMove } from './narration'

describe('describeMove', () => {
  it('describes a successful move', () => {
    const result = describeMove(
      { moved: true, newPosition: { x: 1, y: 2 } },
      'north',
    )
    expect(result).toBe('You have taken a step to the north.')
  })
  it('describes a failed move into a wall', () => {
    const result = describeMove(
      { moved: false, newPosition: { x: 1, y: 1 }, reason: 'wall' },
      'north',
    )
    expect(result).toBe(
      'You cannot move to the north. A wall blocks your path.',
    )
  })
  it('describes a failed move into the edge of the world', () => {
    const result = describeMove(
      { moved: false, newPosition: { x: 0, y: 0 }, reason: 'edge' },
      'west',
    )
    expect(result).toBe(
      'You cannot move to the west. The edge of the world blocks your path.',
    )
  })
})
