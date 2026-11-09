import { describe, it, expect } from 'vitest'
import {
  describeCombatEvent,
  describeCombatStart,
  describeMove,
  describeLowHealth,
  describeRecovery,
  describeYourTurn,
  getAttackOptions,
  describeReveal,
  describeExitInFight,
  describeNoExitNearby,
  describeLocked,
  describeUnlock,
  describeGoThrough,
  describeFullHealth,
  describeEscape,
  describeAlreadyEscaped,
  describeExitReveal,
  describeArrivalExit,
  exitButtonLabel,
  describeNextToExit,
  describePickUp,
  describeItemReveal,
  describeLoot,
} from './narration'
import { PLAYER_ID, type CombatEvent, type CombatResult } from './combat'
import { makeCombatant, makeState, makeStoreEnemy } from './test-helpers'

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
  it('describes a failed move into an enemy', () => {
    const result = describeMove(
      { moved: false, newPosition: { x: 2, y: 2 }, reason: 'enemy' },
      'south',
    )
    expect(result).toBe(
      'You cannot move to the south. An enemy blocks your path.',
    )
  })
  it('describes walking into an exit: where it is and how to use it', () => {
    const result = describeMove(
      { moved: false, newPosition: { x: 1, y: 1 }, reason: 'exit' },
      'north',
    )
    expect(result).toBe('An exit leads north. Press Enter to use it.')
  })

  it('describes a failed move into a feature with a name', () => {
    const result = describeMove(
      {
        moved: false,
        newPosition: { x: 1, y: 1 },
        reason: 'feature',
        name: 'barrel',
      },
      'east',
    )
    expect(result).toBe(
      'You cannot move to the east. A barrel blocks your path.',
    )
  })

  it('describes a failed move into a feature with a name starting with a vowel', () => {
    const result = describeMove(
      {
        moved: false,
        newPosition: { x: 1, y: 1 },
        reason: 'feature',
        name: 'old-statue',
      },
      'east',
    )
    expect(result).toBe(
      'You cannot move to the east. An old statue blocks your path.',
    )
  })

  it('describes a failed move into a feature with a name starting with a vowel and hyphen', () => {
    const result = describeMove(
      {
        moved: false,
        newPosition: { x: 1, y: 1 },
        reason: 'feature',
        name: 'ancient-altar',
      },
      'east',
    )
    expect(result).toBe(
      'You cannot move to the east. An ancient altar blocks your path.',
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
      ).toBe('You have fallen.')
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
      ).toBe('Defeat. Game over. Reload the page to try again.')
    })
  })
})

describe('describeLowHealth', () => {
  it('says low health first, then the health left out of max', () => {
    const player = makeCombatant({ currentHealth: 3, maxHealth: 12 })
    expect(describeLowHealth(player)).toBe(
      'Low health warning: you have 3 out of 12 health remaining.',
    )
  })
})

// `player` is the player before healing, and the second argument is the
// health actually recovered (after the cap), not always RECOVERY_AMOUNT.
describe('describeRecovery', () => {
  it('says the player catches their breath, the amount recovered and the new total', () => {
    const player = makeCombatant({ currentHealth: 3, maxHealth: 12 })
    expect(describeRecovery(player, 4)).toBe(
      'You catch your breath and recover 4 health. You have 7 out of 12 health.',
    )
  })

  it('says the real amount when the cap allowed less than the usual 4', () => {
    const player = makeCombatant({ currentHealth: 10, maxHealth: 12 })
    expect(describeRecovery(player, 2)).toBe(
      'You catch your breath and recover 2 health. You have 12 out of 12 health.',
    )
  })

  it('still says the amount when the healing ends exactly at full health', () => {
    const player = makeCombatant({ currentHealth: 8, maxHealth: 12 })
    expect(describeRecovery(player, 4)).toBe(
      'You catch your breath and recover 4 health. You have 12 out of 12 health.',
    )
  })

  it('says 0 health was recovered, without catching a breath, when health was already full', () => {
    const player = makeCombatant({ currentHealth: 12, maxHealth: 12 })
    expect(describeRecovery(player, 0)).toBe(
      'You recover 0 health. You have 12 out of 12 health.',
    )
  })
})

describe('describeYourTurn', () => {
  it('says it is your turn', () => {
    expect(describeYourTurn()).toBe("It's your turn.")
  })
})

describe('getAttackOptions', () => {
  it('returns one option for one living enemy', () => {
    const state = makeState({
      enemies: [{ id: 'e1', combatant: makeCombatant({ name: 'skeleton' }) }],
    })
    const options = getAttackOptions(state)
    expect(options).toEqual([{ id: 'e1', label: 'Attack the skeleton' }])
  })

  it('returns two options for two living enemies in the order of combat.enemies', () => {
    const state = makeState({
      enemies: [
        { id: 'e1', combatant: makeCombatant({ name: 'skeleton' }) },
        { id: 'e2', combatant: makeCombatant({ name: 'orc' }) },
      ],
    })
    const options = getAttackOptions(state)
    expect(options).toEqual([
      { id: 'e1', label: 'Attack the skeleton' },
      { id: 'e2', label: 'Attack the orc' },
    ])
  })

  it('uses the full name, so numbered enemies get different labels', () => {
    const state = makeState({
      enemies: [
        { id: 'e1', combatant: makeCombatant({ name: 'skeleton 1' }) },
        { id: 'e2', combatant: makeCombatant({ name: 'skeleton 2' }) },
      ],
    })
    const options = getAttackOptions(state)
    expect(options).toEqual([
      { id: 'e1', label: 'Attack the skeleton 1' },
      { id: 'e2', label: 'Attack the skeleton 2' },
    ])
  })

  it('leaves out defeated enemies', () => {
    const state = makeState({
      enemies: [
        {
          id: 'e1',
          combatant: makeCombatant({ name: 'skeleton', currentHealth: 0 }),
        },
        { id: 'e2', combatant: makeCombatant({ name: 'orc' }) },
      ],
    })
    const options = getAttackOptions(state)
    expect(options).toEqual([{ id: 'e2', label: 'Attack the orc' }])
  })

  it('returns an empty array when all enemies are defeated', () => {
    const state = makeState({
      enemies: [
        {
          id: 'e1',
          combatant: makeCombatant({ name: 'skeleton', currentHealth: 0 }),
        },
        {
          id: 'e2',
          combatant: makeCombatant({ name: 'orc', currentHealth: 0 }),
        },
      ],
    })
    const options = getAttackOptions(state)
    expect(options).toEqual([])
  })

  it('never includes the player as an option', () => {
    const state = makeState({
      enemies: [{ id: 'e1', combatant: makeCombatant({ name: 'skeleton' }) }],
    })
    const options = getAttackOptions(state)
    expect(options.map((o) => o.id)).not.toContain(PLAYER_ID)
  })
})

describe('describeCombatStart', () => {
  it('names a single attacker', () => {
    const state = makeState({
      enemies: [{ id: 'e1', combatant: makeCombatant({ name: 'skeleton' }) }],
    })
    expect(describeCombatStart(state)).toBe(
      'The skeleton attacks you! A fight begins.',
    )
  })

  it('joins two attackers with "and" and uses the plural verb', () => {
    const state = makeState({
      enemies: [
        { id: 'e1', combatant: makeCombatant({ name: 'skeleton 1' }) },
        { id: 'e2', combatant: makeCombatant({ name: 'orc' }) },
      ],
    })
    expect(describeCombatStart(state)).toBe(
      'The skeleton 1 and the orc attack you! A fight begins.',
    )
  })

  it('joins three attackers with commas and a final "and"', () => {
    const state = makeState({
      enemies: [
        { id: 'e1', combatant: makeCombatant({ name: 'skeleton' }) },
        { id: 'e2', combatant: makeCombatant({ name: 'orc' }) },
        { id: 'e3', combatant: makeCombatant({ name: 'demon' }) },
      ],
    })
    expect(describeCombatStart(state)).toBe(
      'The skeleton, the orc and the demon attack you! A fight begins.',
    )
  })

  it('throws when the fight has no enemies, because that is a bug', () => {
    const state = makeState({ enemies: [] })
    expect(() => describeCombatStart(state)).toThrow(
      'A fight needs at least one enemy',
    )
  })
})

describe('describeReveal', () => {
  // makeStoreEnemy defaults type and name to the same string, so each test
  // sets them apart: the name must come from combatant.name.
  function enemyNamed(name: string) {
    return makeStoreEnemy('e1', {
      type: 'skeleton',
      combatant: makeCombatant({ name }),
    })
  }

  it('uses "a" the first time an enemy is seen', () => {
    expect(describeReveal(enemyNamed('skeleton'), 'west', false)).toBe(
      'A skeleton appears to the west.',
    )
  })

  it('uses "an" before a name that starts with a vowel', () => {
    expect(describeReveal(enemyNamed('orc'), 'south-east', false)).toBe(
      'An orc appears to the south-east.',
    )
  })

  it('uses "the" when the enemy has been seen before', () => {
    expect(describeReveal(enemyNamed('orc'), 'north', true)).toBe(
      'The orc appears to the north.',
    )
  })

  it('uses no article for a numbered name, the first time', () => {
    expect(describeReveal(enemyNamed('skeleton 1'), 'north', false)).toBe(
      'Skeleton 1 appears to the north.',
    )
  })

  it('uses no article for a numbered name, when seen before', () => {
    expect(describeReveal(enemyNamed('skeleton 12'), 'east', true)).toBe(
      'Skeleton 12 appears to the east.',
    )
  })

  it('uses the combatant name, not the type', () => {
    expect(describeReveal(enemyNamed('demon'), 'west', false)).toBe(
      'A demon appears to the west.',
    )
  })

  describe('a disguised enemy (the mimic)', () => {
    function mimic(disguise: string, name = 'mimic') {
      return makeStoreEnemy('m1', {
        type: 'mimic',
        combatant: makeCombatant({ name }),
        disguise,
      })
    }

    it('is named by its disguise the first time', () => {
      expect(describeReveal(mimic('chest'), 'south', false)).toBe(
        'A chest appears to the south.',
      )
    })

    it('uses "the" with its disguise when it comes back into the light', () => {
      expect(describeReveal(mimic('chest'), 'south', true)).toBe(
        'The chest appears to the south.',
      )
    })

    it('keeps the article rules for the disguise ("an" before a vowel, none for a number)', () => {
      expect(describeReveal(mimic('urn'), 'east', false)).toBe(
        'An urn appears to the east.',
      )
      expect(describeReveal(mimic('chest 2', 'mimic 2'), 'east', false)).toBe(
        'Chest 2 appears to the east.',
      )
    })
  })
})

describe('describeCombatStart with a disguised enemy (the mimic)', () => {
  const mimicEntry = { id: 'm1', combatant: makeCombatant({ name: 'mimic' }) }
  const skeletonEntry = {
    id: 'e1',
    combatant: makeCombatant({ name: 'skeleton' }),
  }

  it('unmasks a mimic that fights alone', () => {
    const state = makeState({ enemies: [mimicEntry] })
    expect(describeCombatStart(state, [{ id: 'm1', disguise: 'chest' }])).toBe(
      "The chest springs open. It's a mimic! A fight begins.",
    )
  })

  it('unmasks the mimic first, then names every attacker by their real name', () => {
    const state = makeState({ enemies: [mimicEntry, skeletonEntry] })
    expect(describeCombatStart(state, [{ id: 'm1', disguise: 'chest' }])).toBe(
      "The chest springs open. It's a mimic! The mimic and the skeleton attack you! A fight begins.",
    )
  })

  it('uses "an" for a real name with a vowel, and no article for a number', () => {
    const orcInDisguise = makeState({
      enemies: [{ id: 'o1', combatant: makeCombatant({ name: 'orc' }) }],
    })
    expect(
      describeCombatStart(orcInDisguise, [{ id: 'o1', disguise: 'chest' }]),
    ).toBe("The chest springs open. It's an orc! A fight begins.")

    const twoMimics = makeState({
      enemies: [
        { id: 'm1', combatant: makeCombatant({ name: 'mimic 1' }) },
        { id: 'm2', combatant: makeCombatant({ name: 'mimic 2' }) },
      ],
    })
    expect(
      describeCombatStart(twoMimics, [
        { id: 'm1', disguise: 'chest 1' },
        { id: 'm2', disguise: 'chest 2' },
      ]),
    ).toBe(
      "The chest 1 springs open. It's mimic 1! The chest 2 springs open. It's mimic 2! A fight begins.",
    )
  })
})

describe('describeLoot', () => {
  it('says what the enemy drops and that the player picks it up', () => {
    const state = makeState({
      enemies: [{ id: 'm1', combatant: makeCombatant({ name: 'mimic' }) }],
    })
    expect(describeLoot(state, 'm1', 'gold key')).toBe(
      'The mimic drops a gold key. You pick it up.',
    )
  })

  it('uses "an" before an item name with a vowel', () => {
    const state = makeState({
      enemies: [{ id: 'o1', combatant: makeCombatant({ name: 'orc' }) }],
    })
    expect(describeLoot(state, 'o1', 'amulet')).toBe(
      'The orc drops an amulet. You pick it up.',
    )
  })
})

describe('describeExitReveal', () => {
  it('uses "An" for the first time an exit is seen', () => {
    expect(describeExitReveal('north', false)).toBe(
      'An exit appears to the north.',
    )
  })

  it('uses "The" when the exit has been seen before', () => {
    expect(describeExitReveal('north', true)).toBe(
      'The exit appears to the north.',
    )
  })

  it('works for a diagonal direction', () => {
    expect(describeExitReveal('south-east', false)).toBe(
      'An exit appears to the south-east.',
    )
  })
})

describe('exit lines', () => {
  // The exact wording, so a changed line shows up in review.
  it('has a line for each exit event', () => {
    expect(describeExitInFight()).toBe("You can't leave during a fight.")
    expect(describeNoExitNearby()).toBe('There is no exit next to you.')
    expect(describeLocked()).toBe('The door is locked. You need a key.')
    expect(describeUnlock('gold key')).toBe(
      'You unlock the door with the gold key.',
    )
    expect(describeGoThrough('north')).toBe(
      'You go through the exit to the north.',
    )
    expect(describeEscape()).toBe(
      'Victory! You climb out of the dungeon. Reload the page to play again.',
    )
    expect(describeAlreadyEscaped()).toBe(
      'You have already escaped the dungeon.',
    )
  })

  it('says the health total after the full heal', () => {
    const player = makeCombatant({ currentHealth: 12, maxHealth: 12 })
    expect(describeFullHealth(player)).toBe(
      'You recover to full health. You have 12 out of 12 health.',
    )
  })
})

describe('describeArrivalExit', () => {
  it('says the way back is to the south', () => {
    expect(describeArrivalExit('south')).toBe('The way back is to the south.')
  })

  it('says the way back is to the north-east', () => {
    expect(describeArrivalExit('north-east')).toBe(
      'The way back is to the north-east.',
    )
  })
})

describe('exitButtonLabel', () => {
  it('says "Go back to the previous room" when isWayBack is true', () => {
    expect(exitButtonLabel(true, 'north')).toBe('Go back to the previous room')
  })

  it('says "Use the exit to the north" when isWayBack is false and direction is north', () => {
    expect(exitButtonLabel(false, 'north')).toBe('Use the exit to the north')
  })

  it('says "Use the exit to the south-east" when isWayBack is false and direction is south-east', () => {
    expect(exitButtonLabel(false, 'south-east')).toBe(
      'Use the exit to the south-east',
    )
  })
})

describe('describeNextToExit', () => {
  it('names the direction of an exit and the key to use it', () => {
    expect(describeNextToExit(false, 'north')).toBe(
      'You are next to the exit to the north. Press Enter to use it.',
    )
  })

  it('calls the exit the player arrived through the way back', () => {
    expect(describeNextToExit(true, 'south')).toBe(
      'You are next to the way back, to the south. Press Enter to use it.',
    )
  })
})

describe('describePickUp', () => {
  it('says what the player picks up, with "a"', () => {
    expect(describePickUp('gold key')).toBe('You pick up a gold key.')
  })

  it('uses "an" before a name that starts with a vowel', () => {
    expect(describePickUp('old amulet')).toBe('You pick up an old amulet.')
  })
})

describe('describeItemReveal', () => {
  it('uses "A" the first time an item is seen', () => {
    expect(describeItemReveal('gold key', 'west', false)).toBe(
      'A gold key lies to the west.',
    )
  })

  it('uses "An" before a name that starts with a vowel', () => {
    expect(describeItemReveal('old amulet', 'north-east', false)).toBe(
      'An old amulet lies to the north-east.',
    )
  })

  it('uses "The" when the item has been seen before', () => {
    expect(describeItemReveal('gold key', 'south', true)).toBe(
      'The gold key lies to the south.',
    )
  })
})
