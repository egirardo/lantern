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
  it("starts on the player's turn with only initiative lines when the player wins initiative", () => {
    const skeleton = makeSkeleton()
    // Player's initiative, then e1's. No more values: if an enemy tried to
    // attack, sequence would throw.
    const dice = sequence(rollOf(20, 20), rollOf(2, 20))

    const step = beginCombat(makeHero(), [skeleton], [skeleton], dice)

    expect(step.combat?.turnOrder).toEqual([PLAYER_ID, 'e1'])
    expect(step.combat?.turnIndex).toBe(0)
    expect(urgencies(step)).toEqual(['polite', 'polite'])
    expect(texts(step)).toEqual([
      'You roll initiative: 20 + 0 = 20.',
      'The skeleton rolls initiative: 2 + 0 = 2.',
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
    expect(urgencies(step)).toEqual(['polite', 'polite', 'polite'])
    expect(texts(step)).toEqual([
      'The skeleton rolls initiative: 20 + 0 = 20.',
      'You roll initiative: 2 + 0 = 2.',
      'The skeleton hits you for 4 damage (15 + 3 = 18 against armor class 12).',
    ])
  })

  it("adds an assertive low-health line last when the enemy's first hit makes the player's health low", () => {
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
    expect(urgencies(step)).toEqual(['polite', 'polite', 'polite', 'assertive'])
    expect(texts(step).at(-1)).toBe(
      'Low health warning: you have 2 out of 12 health remaining.',
    )
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
    ])
    expect(texts(step)).toEqual([
      'The skeleton rolls initiative: 20 + 0 = 20.',
      'You roll initiative: 2 + 0 = 2.',
      'The skeleton hits you for 6 damage (15 + 3 = 18 against armor class 12).',
      'You are defeated.',
      'Defeat. The fight is over.',
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
    expect(texts(step).at(-1)).toBe('Victory. No enemies are left standing.')
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

  it("adds an assertive low-health line last when the enemy's reply makes the player's health low", () => {
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
    expect(urgencies(step)).toEqual(['polite', 'polite', 'assertive'])
    expect(texts(step).at(-1)).toBe(
      'Low health warning: you have 2 out of 12 health remaining.',
    )
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
    expect(texts(step).at(-2)).toBe('You are defeated.')
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
})
