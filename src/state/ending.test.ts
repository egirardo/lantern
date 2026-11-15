import { describe, expect, it } from 'vitest'
import { selectEnding } from './ending'

// Only the two fields selectEnding reads; the player's other stats don't
// matter here.
function stateWith(hasEscaped: boolean, currentHealth: number) {
  return {
    hasEscaped,
    player: { currentHealth } as Parameters<typeof selectEnding>[0]['player'],
  }
}

describe('selectEnding', () => {
  it('is null while the player is alive and still inside', () => {
    expect(selectEnding(stateWith(false, 12))).toBeNull()
    expect(selectEnding(stateWith(false, 1))).toBeNull()
  })

  it('is victory once the player has escaped', () => {
    expect(selectEnding(stateWith(true, 5))).toBe('victory')
  })

  it('is defeat at 0 health or below', () => {
    expect(selectEnding(stateWith(false, 0))).toBe('defeat')
    expect(selectEnding(stateWith(false, -3))).toBe('defeat')
  })
})
