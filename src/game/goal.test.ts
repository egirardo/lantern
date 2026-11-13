import { describe, it, expect } from 'vitest'
import { describeGoal, goalHasKey, GOAL_KEY } from './goal'

describe('describeGoal', () => {
  it('asks the player to explore before they know a key is needed', () => {
    expect(describeGoal([], false)).toEqual({
      step: 'explore',
      text: 'Explore your surroundings.',
    })
  })

  it('asks for the key once the player has found the locked door', () => {
    expect(describeGoal([], true)).toEqual({
      step: 'find-key',
      text: 'Find the gold key.',
    })
  })

  it('points to the great door when the key is carried but the door not found', () => {
    expect(describeGoal([GOAL_KEY], false)).toEqual({
      step: 'find-door',
      text: 'You have the gold key. Find the great door.',
    })
  })

  it('sends the player back to the great door they already found', () => {
    expect(describeGoal([GOAL_KEY], true)).toEqual({
      step: 'return-to-door',
      text: 'You have the gold key. Return to the great door.',
    })
  })

  it('does not count another item as the key', () => {
    expect(describeGoal(['silver-key'], false).step).toBe('explore')
    expect(describeGoal(['silver-key'], true).step).toBe('find-key')
  })

  it('finds the key anywhere in the inventory, not only first', () => {
    expect(describeGoal(['silver-key', GOAL_KEY], false).step).toBe('find-door')
    expect(describeGoal(['silver-key', GOAL_KEY], true).step).toBe(
      'return-to-door',
    )
  })

  it('uses the item type the great door needs', () => {
    expect(GOAL_KEY).toBe('gold-key')
  })
})

describe('goalHasKey', () => {
  it('is true only for the steps where the key is carried', () => {
    expect(goalHasKey('explore')).toBe(false)
    expect(goalHasKey('find-key')).toBe(false)
    expect(goalHasKey('find-door')).toBe(true)
    expect(goalHasKey('return-to-door')).toBe(true)
  })
})
