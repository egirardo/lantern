import { describe, it, expect } from 'vitest'
import { describeCombatEvent, describeMove } from './narration'
import { PLAYER_ID, type CombatEvent, type CombatResult } from './combat'
import { makeCombatant, makeState } from './test-helpers'

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

describe('describeCombatEvent', () => {
  // The enemy's name is lowercase because narration adds "The" or "the".
  const state = makeState({
    player: makeCombatant({ name: 'Hero' }),
    enemies: [{ id: 'e1', combatant: makeCombatant({ name: 'skeleton' }) }],
  })

  const hit: CombatResult = {
    hit: true,
    naturalRoll: 12,
    total: 14,
    opposingArmorClass: 10,
    damage: 3,
    natural20: false,
  }
  const miss: CombatResult = {
    hit: false,
    naturalRoll: 5,
    total: 7,
    opposingArmorClass: 10,
    natural1: false,
  }

  function attack(
    attackerId: string,
    targetId: string,
    result: CombatResult,
  ): CombatEvent {
    return { type: 'attack', attackerId, targetId, result }
  }

  describe('attack', () => {
    it('describes a hit by the player', () => {
      expect(describeCombatEvent(state, attack(PLAYER_ID, 'e1', hit))).toBe(
        'You hit the skeleton for 3 damage (12 + 2 = 14 against armor class 10).',
      )
    })

    it('describes a hit by an enemy', () => {
      expect(describeCombatEvent(state, attack('e1', PLAYER_ID, hit))).toBe(
        'The skeleton hits you for 3 damage (12 + 2 = 14 against armor class 10).',
      )
    })

    it('describes a miss by the player', () => {
      expect(describeCombatEvent(state, attack(PLAYER_ID, 'e1', miss))).toBe(
        'You miss the skeleton (5 + 2 = 7 against armor class 10).',
      )
    })

    it('describes a miss by an enemy', () => {
      expect(describeCombatEvent(state, attack('e1', PLAYER_ID, miss))).toBe(
        'The skeleton misses you (5 + 2 = 7 against armor class 10).',
      )
    })

    it('describes a critical hit by the player', () => {
      const critical: CombatResult = {
        ...hit,
        naturalRoll: 20,
        total: 22,
        damage: 7,
        natural20: true,
      }
      expect(
        describeCombatEvent(state, attack(PLAYER_ID, 'e1', critical)),
      ).toBe(
        'You roll a natural 20 and land a critical hit on the skeleton for 7 damage!',
      )
    })

    it('describes a critical hit by an enemy', () => {
      const critical: CombatResult = {
        ...hit,
        naturalRoll: 20,
        total: 22,
        damage: 7,
        natural20: true,
      }
      expect(
        describeCombatEvent(state, attack('e1', PLAYER_ID, critical)),
      ).toBe(
        'The skeleton rolls a natural 20 and lands a critical hit on you for 7 damage!',
      )
    })

    it('describes a natural 1 by the player', () => {
      const fumble: CombatResult = {
        ...miss,
        naturalRoll: 1,
        total: 3,
        natural1: true,
      }
      expect(describeCombatEvent(state, attack(PLAYER_ID, 'e1', fumble))).toBe(
        'You roll a natural 1 and miss the skeleton!',
      )
    })

    it('describes a natural 1 by an enemy', () => {
      const fumble: CombatResult = {
        ...miss,
        naturalRoll: 1,
        total: 3,
        natural1: true,
      }
      expect(describeCombatEvent(state, attack('e1', PLAYER_ID, fumble))).toBe(
        'The skeleton rolls a natural 1 and misses you!',
      )
    })

    it('shows a negative bonus with a minus sign', () => {
      const negative: CombatResult = { ...miss, naturalRoll: 8, total: 7 }
      expect(
        describeCombatEvent(state, attack(PLAYER_ID, 'e1', negative)),
      ).toBe('You miss the skeleton (8 - 1 = 7 against armor class 10).')
    })

    it('shows a zero bonus with a plus sign', () => {
      const zero: CombatResult = { ...miss, naturalRoll: 8, total: 8 }
      expect(describeCombatEvent(state, attack(PLAYER_ID, 'e1', zero))).toBe(
        'You miss the skeleton (8 + 0 = 8 against armor class 10).',
      )
    })

    it('throws for an unknown id', () => {
      expect(() =>
        describeCombatEvent(state, attack(PLAYER_ID, 'nobody', hit)),
      ).toThrow('No combatant with id nobody')
    })
  })

  describe('initiative', () => {
    it('describes the player rolling initiative', () => {
      const event: CombatEvent = {
        type: 'initiative',
        combatantId: PLAYER_ID,
        initiativeRoll: { naturalRoll: 12, total: 14 },
      }
      expect(describeCombatEvent(state, event)).toBe(
        'You roll initiative: 12 + 2 = 14.',
      )
    })

    it('describes an enemy rolling initiative', () => {
      const event: CombatEvent = {
        type: 'initiative',
        combatantId: 'e1',
        initiativeRoll: { naturalRoll: 9, total: 10 },
      }
      expect(describeCombatEvent(state, event)).toBe(
        'The skeleton rolls initiative: 9 + 1 = 10.',
      )
    })
  })

  describe('defeated', () => {
    it('describes a defeated enemy', () => {
      expect(
        describeCombatEvent(state, { type: 'defeated', combatantId: 'e1' }),
      ).toBe('The skeleton is defeated.')
    })

    it('describes a defeated player', () => {
      expect(
        describeCombatEvent(state, {
          type: 'defeated',
          combatantId: PLAYER_ID,
        }),
      ).toBe('You are defeated.')
    })
  })

  describe('combat-ended', () => {
    it('describes a victory', () => {
      expect(
        describeCombatEvent(state, {
          type: 'combat-ended',
          outcome: 'victory',
        }),
      ).toBe('Victory. No enemies are left standing.')
    })

    it('describes a defeat', () => {
      expect(
        describeCombatEvent(state, { type: 'combat-ended', outcome: 'defeat' }),
      ).toBe('Defeat. The fight is over.')
    })
  })
})
