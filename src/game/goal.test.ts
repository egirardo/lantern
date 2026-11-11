import { describe, it, expect } from 'vitest'
import { describeGoal, GOAL_KEY } from './goal'

describe('describeGoal', () => {
  it('asks for the key when the inventory is empty', () => {
    expect(describeGoal([])).toEqual({
      step: 'find-key',
      text: 'Find the gold key.',
    })
  })

  it('points to the great door once the key is carried', () => {
    expect(describeGoal([GOAL_KEY])).toEqual({
      step: 'find-door',
      text: 'You have the gold key. Find the great door.',
    })
  })

  it('still asks for the key when the player carries something else', () => {
    expect(describeGoal(['silver-key']).step).toBe('find-key')
  })

  it('finds the key anywhere in the inventory, not only first', () => {
    expect(describeGoal(['silver-key', GOAL_KEY]).step).toBe('find-door')
  })

  it('uses the item type the great door needs', () => {
    expect(GOAL_KEY).toBe('gold-key')
  })
})
