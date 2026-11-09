import { describe, expect, it } from 'vitest'
import { PLAYER_ID } from './combat'
import { beginCombat, type CombatStep, playerAttackStep } from './combat-flow'
import {
  makeCombatant,
  makeState,
  makeStoreEnemy,
  rollOf,
  sequence,
} from './test-helpers'

// Short ways to look at the log lines, so each expectation is one line.
const texts = (step: CombatStep) => step.lines.map((line) => line.text)
const urgencies = (step: CombatStep) => step.lines.map((line) => line.urgency)

// A fresh player with 12 of 12 health (low-health threshold 3), or less.
function makeHero(currentHealth = 12) {
  return makeCombatant({ name: 'Hero', currentHealth, maxHealth: 12 })
}

// A fresh skeleton. The name lives on the combatant, which is what narration
// reads ("the skeleton"). `type` is only for the store and the sprite.
function makeSkeleton() {
  return makeStoreEnemy('e1', {
    type: 'skeleton',
    position: { x: 4, y: 2 },
    combatant: makeCombatant({ name: 'skeleton' }),
  })
}

describe('beginCombat', () => {
  it("starts on the player's turn with only the start and initiative lines when the player wins initiative", () => {
    const skeleton = makeSkeleton()
    // Player's initiative, then e1's. No more values: if an enemy tried to
    // attack, sequence would throw.
    const dice = sequence(rollOf(20, 20), rollOf(2, 20))

    const step = beginCombat(makeHero(), [skeleton], [skeleton], dice)

    expect(step.combat?.turnOrder).toEqual([PLAYER_ID, 'e1'])
    expect(step.combat?.turnIndex).toBe(0)
    expect(urgencies(step)).toEqual(['polite', 'polite', 'polite', 'polite'])
    expect(texts(step)).toEqual([
      'The skeleton attacks you! A fight begins.',
      'You roll initiative: 20 + 0 = 20.',
      'The skeleton rolls initiative: 2 + 0 = 2.',
      "It's your turn.",
    ])
  })

  it('only lets the adjacent enemies join, and keeps the others in the store', () => {
    const skeleton = makeSkeleton()
    const orc = makeStoreEnemy('e2', {
      type: 'orc',
      position: { x: 10, y: 8 },
      combatant: makeCombatant({ name: 'orc', currentHealth: 6 }),
    })
    // Only two initiative rolls: the player and the skeleton. If the orc
    // joined, it would roll a third time and sequence would throw.
    const dice = sequence(rollOf(20, 20), rollOf(2, 20))

    const step = beginCombat(makeHero(), [skeleton, orc], [skeleton], dice)

    expect(step.combat?.enemies.map((entry) => entry.id)).toEqual(['e1'])
    expect(step.enemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        position: { x: 4, y: 2 },
        combatant: makeCombatant({ name: 'skeleton' }),
      },
      {
        id: 'e2',
        type: 'orc',
        position: { x: 10, y: 8 },
        combatant: makeCombatant({ name: 'orc', currentHealth: 6 }),
      },
    ])
  })

  it('lets an enemy that wins initiative attack before the player acts', () => {
    const skeleton = makeSkeleton()
    const dice = sequence(
      rollOf(2, 20), // player's initiative
      rollOf(20, 20), // skeleton's initiative, so it goes first
      rollOf(15, 20), // skeleton's attack: 15 + 3 = 18 beats armor class 12
      rollOf(4, 6), // damage
    )

    const step = beginCombat(makeHero(), [skeleton], [skeleton], dice)

    // The synced player the store gets, not only the one inside the combat.
    expect(step.player.currentHealth).toBe(8)
    // The skeleton acted, so now it's the player's turn.
    expect(step.combat?.turnOrder).toEqual(['e1', PLAYER_ID])
    expect(step.combat?.turnIndex).toBe(1)
    expect(urgencies(step)).toEqual([
      'polite',
      'polite',
      'polite',
      'polite',
      'polite',
    ])
    expect(texts(step)).toEqual([
      'The skeleton attacks you! A fight begins.',
      'The skeleton rolls initiative: 20 + 0 = 20.',
      'You roll initiative: 2 + 0 = 2.',
      'The skeleton hits you for 4 damage (15 + 3 = 18 against armor class 12).',
      "It's your turn.",
    ])
  })

  it("adds an assertive low-health line before the turn cue when the enemy's first hit makes the player's health low", () => {
    const skeleton = makeSkeleton()
    const dice = sequence(
      rollOf(2, 20), // player's initiative
      rollOf(20, 20), // skeleton's initiative
      rollOf(15, 20), // skeleton's attack hits
      rollOf(4, 6), // 4 damage: 6 → 2, crossing the threshold of 3
    )

    const step = beginCombat(makeHero(6), [skeleton], [skeleton], dice)

    expect(step.player.currentHealth).toBe(2)
    expect(step.combat).not.toBeNull()
    expect(urgencies(step)).toEqual([
      'polite',
      'polite',
      'polite',
      'polite',
      'assertive',
      'polite',
    ])
    // The warning is second to last: "It's your turn." is always the final
    // line of an ongoing fight, because it's the cue to act (decided Nov 2).
    expect(texts(step).at(-2)).toBe(
      'Low health warning: you have 2 out of 12 health remaining.',
    )
    expect(texts(step).at(-1)).toBe("It's your turn.")
  })

  it('ends the combat with no low-health line when the first hit kills the player', () => {
    const skeleton = makeSkeleton()
    const dice = sequence(
      rollOf(2, 20), // player's initiative
      rollOf(20, 20), // skeleton's initiative
      rollOf(15, 20), // skeleton's attack hits
      rollOf(6, 6), // 6 damage: 5 → 0
    )

    // 5 is above the threshold of 3, so the only reason for "no low-health
    // line" is the killing-blow rule, not "already low".
    const step = beginCombat(makeHero(5), [skeleton], [skeleton], dice)

    expect(step.player.currentHealth).toBe(0)
    expect(step.combat).toBeNull()
    expect(urgencies(step)).toEqual([
      'polite',
      'polite',
      'polite',
      'polite',
      'polite',
      'polite',
    ])
    expect(texts(step)).toEqual([
      'The skeleton attacks you! A fight begins.',
      'The skeleton rolls initiative: 20 + 0 = 20.',
      'You roll initiative: 2 + 0 = 2.',
      'The skeleton hits you for 6 damage (15 + 3 = 18 against armor class 12).',
      'You have fallen.',
      'Defeat. Game over. Reload the page to try again.',
    ])
  })
})

describe('playerAttackStep', () => {
  it('narrates the attack and the enemy reply in order, and syncs the hurt enemy to the store', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(2, 6), // 2 damage: skeleton 5 → 3
      rollOf(15, 20), // the skeleton's attack hits
      rollOf(4, 6), // 4 damage: you 12 → 8
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.enemies.map((e) => e.combatant.currentHealth)).toEqual([3])
    expect(step.player.currentHealth).toBe(8)
    expect(step.combat?.turnIndex).toBe(0) // your turn again
    expect(texts(step)).toEqual([
      'You hit the skeleton for 2 damage (15 + 3 = 18 against armor class 12).',
      'The skeleton hits you for 4 damage (15 + 3 = 18 against armor class 12).',
      "It's your turn.",
    ])
  })

  it('ends the combat when you kill the last enemy', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: skeleton 5 → 0, defeated
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.combat).toBeNull()
    expect(step.enemies).toEqual([])
    // The hero was already at 12 out of 12, so health stays at the max and
    // the recovery line is the "nothing recovered" one. It comes after the
    // victory line, and there's no "It's your turn." after a won fight.
    expect(step.player.currentHealth).toBe(12)
    expect(texts(step).at(-2)).toBe('Victory. No enemies are left standing.')
    expect(texts(step).at(-1)).toBe(
      'You recover 0 health. You have 12 out of 12 health.',
    )
  })

  it('removes a defeated enemy and lets the other one attack', () => {
    const skeleton = makeSkeleton()
    const orc = makeStoreEnemy('e2', {
      type: 'orc',
      position: { x: 5, y: 3 },
      combatant: makeCombatant({ name: 'orc', currentHealth: 6 }),
    })
    const combat = makeState({
      player: makeHero(),
      enemies: [
        { id: 'e1', combatant: skeleton.combatant },
        { id: 'e2', combatant: orc.combatant },
      ],
      turnOrder: [PLAYER_ID, 'e1', 'e2'],
    })
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: skeleton 5 → 0, defeated
      rollOf(15, 20), // the orc's attack hits
      rollOf(4, 6), // 4 damage to you
    )

    const step = playerAttackStep(combat, [skeleton, orc], 'e1', dice)

    expect(step.enemies.map((e) => e.id)).toEqual(['e2'])
    expect(step.combat).not.toBeNull()
  })

  it("adds an assertive low-health line before the turn cue when the enemy's reply makes the player's health low", () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(6),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(2, 20), // your attack misses: 2 + 3 = 5 against armor class 12
      rollOf(15, 20), // the skeleton's attack hits
      rollOf(4, 6), // 4 damage: you 6 → 2, crossing the threshold of 3
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.player.currentHealth).toBe(2)
    expect(urgencies(step)).toEqual(['polite', 'polite', 'assertive', 'polite'])
    expect(texts(step).at(-2)).toBe(
      'Low health warning: you have 2 out of 12 health remaining.',
    )
    expect(texts(step).at(-1)).toBe("It's your turn.")
  })

  it('adds no low-health line when the player was already low', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(3),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(1, 20), // your attack misses
      rollOf(15, 20), // the skeleton's attack hits
      rollOf(1, 6), // 1 damage to you
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.player.currentHealth).toBe(2)
    expect(step.combat).not.toBeNull()
    expect(urgencies(step)).not.toContain('assertive')
  })

  it('ends the combat with no low-health line when the reply kills the player', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(5),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(1, 20), // your attack misses
      rollOf(15, 20), // the skeleton's attack hits
      rollOf(5, 6), // 5 damage to you
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.player.currentHealth).toBe(0)
    expect(step.combat).toBeNull()
    expect(urgencies(step)).not.toContain('assertive')
    expect(texts(step).at(-2)).toBe('You have fallen.')
  })

  it('does not change its inputs', () => {
    const skeleton = makeSkeleton()
    const orc = makeStoreEnemy('e2', {
      type: 'orc',
      position: { x: 5, y: 3 },
      combatant: makeCombatant({ name: 'orc', currentHealth: 6 }),
    })
    const combat = makeState({
      player: makeHero(),
      enemies: [
        { id: 'e1', combatant: skeleton.combatant },
        { id: 'e2', combatant: orc.combatant },
      ],
      turnOrder: [PLAYER_ID, 'e1', 'e2'],
    })
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: skeleton 5 → 0, defeated
      rollOf(15, 20), // the orc's attack hits
      rollOf(4, 6), // 4 damage to you
    )

    // One variable for the array, so the test checks the same array that was
    // passed in. A new [skeleton, orc] each time would hide a splice on it.
    const enemies = [skeleton, orc]
    const combatBefore = structuredClone(combat)
    const enemiesBefore = structuredClone(enemies)

    playerAttackStep(combat, enemies, 'e1', dice)

    expect(combat).toEqual(combatBefore)
    expect(enemies).toEqual(enemiesBefore)
  })

  it('heals the player after a won fight and narrates it', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(5),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: skeleton 5 → 0, defeated
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.combat).toBeNull()
    expect(step.player.currentHealth).toBe(9)
    expect(texts(step).at(-1)).toBe(
      'You catch your breath and recover 4 health. You have 9 out of 12 health.',
    )
    expect(urgencies(step).at(-1)).toBe('polite')
  })

  it('heals only up to max health after a won fight', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(10),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: skeleton 5 → 0, defeated
    )

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.combat).toBeNull()
    expect(step.player.currentHealth).toBe(12)
    expect(texts(step).at(-1)).toBe(
      'You catch your breath and recover 2 health. You have 12 out of 12 health.',
    )
    expect(urgencies(step).at(-1)).toBe('polite')
  })

  it('re-arms the low-health warning after a won fight', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(2),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice1 = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: skeleton 5 → 0, defeated
    )

    const step1 = playerAttackStep(combat, [skeleton], 'e1', dice1)

    expect(step1.player.currentHealth).toBe(6)
    expect(step1.combat).toBeNull()

    const freshSkeleton = makeSkeleton()
    const dice2 = sequence(
      rollOf(2, 20), // player's initiative
      rollOf(20, 20), // skeleton's initiative
      rollOf(15, 20), // skeleton's attack hits
      rollOf(4, 6), // 4 damage: 6 → 2, crossing the threshold of 3
    )

    const step2 = beginCombat(
      step1.player,
      [freshSkeleton],
      [freshSkeleton],
      dice2,
    )

    expect(step2.player.currentHealth).toBe(2)
    expect(step2.combat).not.toBeNull()
    expect(urgencies(step2)).toContain('assertive')
  })
})

describe('the mimic: unmasking and the carried key (Nov 9)', () => {
  // A mimic disguised as a chest and carrying the gold key, as spawnEnemies
  // makes it from the vault's room file. 5 health, armor class 12.
  function makeMimic() {
    return makeStoreEnemy('m1', {
      type: 'mimic',
      position: { x: 6, y: 5 },
      combatant: makeCombatant({ name: 'mimic' }),
      disguise: 'chest',
      carries: 'gold-key',
    })
  }

  // The same mimic once a fight has started: no disguise any more.
  function makeUnmaskedMimic() {
    return makeStoreEnemy('m1', {
      type: 'mimic',
      position: { x: 6, y: 5 },
      combatant: makeCombatant({ name: 'mimic' }),
      carries: 'gold-key',
    })
  }

  // A fight against the mimic alone, on the player's turn.
  function fightWithMimic() {
    return makeState({
      player: makeHero(),
      enemies: [{ id: 'm1', combatant: makeCombatant({ name: 'mimic' }) }],
      turnOrder: [PLAYER_ID, 'm1'],
    })
  }

  it('unmasks the mimic in the first line, and every line after says "mimic"', () => {
    const mimic = makeMimic()
    const dice = sequence(
      rollOf(2, 20), // player's initiative
      rollOf(20, 20), // mimic's initiative: it goes first
      rollOf(15, 20), // the mimic's attack hits
      rollOf(4, 6), // 4 damage
    )

    const step = beginCombat(makeHero(), [mimic], [mimic], dice)

    expect(texts(step)).toEqual([
      "The chest springs open. It's a mimic! A fight begins.",
      'The mimic rolls initiative: 20 + 0 = 20.',
      'You roll initiative: 2 + 0 = 2.',
      'The mimic hits you for 4 damage (15 + 3 = 18 against armor class 12).',
      "It's your turn.",
    ])
  })

  it('takes the disguise off the mimic in the store, so it stays unmasked', () => {
    const mimic = makeMimic()
    const dice = sequence(rollOf(20, 20), rollOf(2, 20))

    const step = beginCombat(makeHero(), [mimic], [mimic], dice)

    expect(step.enemies[0]).not.toHaveProperty('disguise')
    // It still carries the key: only the disguise comes off.
    expect(step.enemies[0]?.carries).toBe('gold-key')
    expect(step.loot).toEqual([])
  })

  it('leaves a mimic that is not in the fight disguised', () => {
    const skeleton = makeSkeleton()
    const farMimic = { ...makeMimic(), position: { x: 10, y: 8 } }
    const dice = sequence(rollOf(20, 20), rollOf(2, 20))

    const step = beginCombat(makeHero(), [skeleton, farMimic], [skeleton], dice)

    expect(texts(step)[0]).toBe('The skeleton attacks you! A fight begins.')
    expect(step.enemies[1]?.disguise).toBe('chest')
  })

  it('reads well when a mimic and another enemy start a fight together', () => {
    const mimic = makeMimic()
    const skeleton = makeSkeleton()
    const dice = sequence(rollOf(20, 20), rollOf(2, 20), rollOf(3, 20))

    const step = beginCombat(
      makeHero(),
      [mimic, skeleton],
      [mimic, skeleton],
      dice,
    )

    expect(texts(step)[0]).toBe(
      "The chest springs open. It's a mimic! The mimic and the skeleton attack you! A fight begins.",
    )
  })

  it('puts the carried key in the loot when the mimic is defeated, with a line after the defeat', () => {
    const dice = sequence(
      rollOf(15, 20), // your attack hits
      rollOf(6, 6), // 6 damage: mimic 5 → 0, defeated
    )

    const step = playerAttackStep(
      fightWithMimic(),
      [makeUnmaskedMimic()],
      'm1',
      dice,
    )

    expect(step.loot).toEqual(['gold-key'])
    expect(step.enemies).toEqual([])
    expect(texts(step)).toEqual([
      'You hit the mimic for 6 damage (15 + 3 = 18 against armor class 12).',
      'The mimic is defeated.',
      'The mimic drops a gold key. You pick it up.',
      'Victory. No enemies are left standing.',
      'You recover 0 health. You have 12 out of 12 health.',
    ])
  })

  it('drops nothing while the mimic is still alive', () => {
    const dice = sequence(
      rollOf(2, 20), // your attack misses
      rollOf(2, 20), // the mimic's attack misses
    )

    const step = playerAttackStep(
      fightWithMimic(),
      [makeUnmaskedMimic()],
      'm1',
      dice,
    )

    expect(step.loot).toEqual([])
    expect(texts(step).join(' ')).not.toContain('drops')
  })

  it('drops nothing when an enemy that carries nothing is defeated', () => {
    const skeleton = makeSkeleton()
    const combat = makeState({
      player: makeHero(),
      enemies: [{ id: 'e1', combatant: skeleton.combatant }],
      turnOrder: [PLAYER_ID, 'e1'],
    })
    const dice = sequence(rollOf(15, 20), rollOf(6, 6))

    const step = playerAttackStep(combat, [skeleton], 'e1', dice)

    expect(step.loot).toEqual([])
  })
})
