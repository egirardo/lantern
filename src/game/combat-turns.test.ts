import { describe, it, expect } from 'vitest'
import { PLAYER_ID, type CombatEntry, type CombatState } from './combat'
import {
  startCombat,
  resolvePlayerAttack,
  resolveEnemyTurns,
} from './combat-turns'
import {
  enemyHitEvent,
  hitEvent,
  hitRoll,
  healths,
  makeCombatant,
  makeEnemyTurn,
  makeFight,
  rollOf,
  sequence,
} from './test-helpers'

// An enemy entry with just the id and initiative bonus a test cares about.
function makeEnemy(id: string, initiativeBonus = 0): CombatEntry {
  return { id, combatant: makeCombatant({ initiativeBonus }) }
}

// startCombat rolls one d20 per combatant: the player first, then the enemies
// in the order of the array. So in every test, the values given to `sequence`
// are: player, first enemy, second enemy, and so on.
describe('startCombat', () => {
  // Each row: the player and e1 roll a d20 and add a bonus, as { roll, bonus }.
  // `order` is the expected turn order. The bonus rows are built so that the
  // order would be different if the bonus were ignored.
  it.each([
    {
      name: 'puts the highest initiative first',
      player: { roll: 10, bonus: 0 },
      e1: { roll: 15, bonus: 0 },
      order: ['e1', PLAYER_ID],
    },
    {
      name: 'resolves a tie in favor of the player',
      player: { roll: 10, bonus: 0 },
      e1: { roll: 10, bonus: 0 },
      order: [PLAYER_ID, 'e1'],
    },
    {
      name: "lets the player's bonus decide (8 + 4 beats 10)",
      player: { roll: 8, bonus: 4 },
      e1: { roll: 10, bonus: 0 },
      order: [PLAYER_ID, 'e1'],
    },
    {
      name: "lets an enemy's bonus decide (8 + 4 beats 10)",
      player: { roll: 10, bonus: 0 },
      e1: { roll: 8, bonus: 4 },
      order: ['e1', PLAYER_ID],
    },
  ])('$name', ({ player, e1, order }) => {
    const random = sequence(rollOf(player.roll, 20), rollOf(e1.roll, 20))

    const { state } = startCombat(
      makeCombatant({ initiativeBonus: player.bonus }),
      [makeEnemy('e1', e1.bonus)],
      random,
    )

    expect(state.turnOrder).toEqual(order)
    expect(state.turnIndex).toBe(0)
  })

  it('sorts three combatants', () => {
    // player rolls 12, e1 rolls 5, e2 rolls 18
    const random = sequence(rollOf(12, 20), rollOf(5, 20), rollOf(18, 20))

    const { state } = startCombat(
      makeCombatant(),
      [makeEnemy('e1'), makeEnemy('e2')],
      random,
    )

    expect(state.turnOrder).toEqual(['e2', PLAYER_ID, 'e1'])
  })

  it('keeps the original order when two enemies tie', () => {
    // player rolls 5, e1 rolls 14, e2 rolls 14
    const random = sequence(rollOf(5, 20), rollOf(14, 20), rollOf(14, 20))

    const { state } = startCombat(
      makeCombatant(),
      [makeEnemy('e1'), makeEnemy('e2')],
      random,
    )

    expect(state.turnOrder).toEqual(['e1', 'e2', PLAYER_ID])
  })

  it('returns one initiative event per combatant, in turn order', () => {
    // player rolls 10 + 2 = 12, e1 rolls 15 + 1 = 16
    const random = sequence(rollOf(10, 20), rollOf(15, 20))

    const { events } = startCombat(
      makeCombatant({ initiativeBonus: 2 }),
      [makeEnemy('e1', 1)],
      random,
    )

    expect(events).toEqual([
      {
        type: 'initiative',
        combatantId: 'e1',
        initiativeRoll: { naturalRoll: 15, total: 16 },
      },
      {
        type: 'initiative',
        combatantId: PLAYER_ID,
        initiativeRoll: { naturalRoll: 10, total: 12 },
      },
    ])
  })

  it('keeps the player and enemies as they were passed in', () => {
    const random = sequence(rollOf(10, 20), rollOf(15, 20))
    const player = makeCombatant()
    const enemies = [makeEnemy('e1')]

    const { state } = startCombat(player, enemies, random)

    expect(state.player).toEqual(player)
    expect(state.enemies).toEqual(enemies)
  })

  it('throws when there are no enemies', () => {
    // No random is passed on purpose: the check has to happen before any dice
    // are rolled.
    expect(() => startCombat(makeCombatant(), [])).toThrow(
      'Cannot start combat with no enemies',
    )
  })

  it('does not change the player or enemies passed in', () => {
    // Two enemies, so that reordering the array would show.
    const random = sequence(rollOf(10, 20), rollOf(15, 20), rollOf(18, 20))
    const player = makeCombatant()
    const enemies = [makeEnemy('e1'), makeEnemy('e2')]
    const playerBefore = structuredClone(player)
    const enemiesBefore = structuredClone(enemies)

    startCombat(player, enemies, random)

    expect(player).toEqual(playerBefore)
    expect(enemies).toEqual(enemiesBefore)
  })
})

describe('resolvePlayerAttack', () => {
  it('lowers only the targeted enemy by the damage rolled', () => {
    const { state, events } = resolvePlayerAttack(
      makeFight(5, 5),
      'e2',
      hitRoll(3),
    )

    expect(healths(state)).toEqual([5, 2])
    expect(events).toEqual([hitEvent('e2', 3)])
  })

  it('does not lower health on a miss, but still emits an attack event', () => {
    // A 5 + 2 = 7 misses armor class 12, and no damage die is rolled.
    const random = sequence(rollOf(5, 20))

    const { state, events } = resolvePlayerAttack(makeFight(5, 5), 'e2', random)

    expect(healths(state)).toEqual([5, 5])
    expect(events).toEqual([
      {
        type: 'attack',
        attackerId: PLAYER_ID,
        targetId: 'e2',
        result: {
          hit: false,
          naturalRoll: 5,
          total: 7,
          opposingArmorClass: 12,
          natural1: false,
        },
      },
    ])
  })

  it('does double damage on a natural 20', () => {
    // 20, then two damage dice: 3 + 4 = 7
    const random = sequence(rollOf(20, 20), rollOf(3, 6), rollOf(4, 6))

    const { state, events } = resolvePlayerAttack(makeFight(10), 'e1', random)

    expect(healths(state)).toEqual([3])
    expect(events).toEqual([hitEvent('e1', 7, 20)])
  })

  it('defeats an enemy at 0 health and keeps it in the state', () => {
    // 5 damage on an enemy with 3 health: health stops at 0, not -2.
    const { state, events } = resolvePlayerAttack(
      makeFight(5, 3),
      'e2',
      hitRoll(5),
    )

    expect(healths(state)).toEqual([5, 0])
    expect(state.enemies).toHaveLength(2)
    expect(state.turnOrder).toEqual([PLAYER_ID, 'e1', 'e2'])
    // One enemy is still alive, so there is no combat-ended.
    expect(events).toEqual([
      hitEvent('e2', 5),
      { type: 'defeated', combatantId: 'e2' },
    ])
  })

  it('ends the combat with a victory when the last enemy is defeated', () => {
    const { state, events } = resolvePlayerAttack(
      makeFight(5),
      'e1',
      hitRoll(5),
    )

    expect(events).toEqual([
      hitEvent('e1', 5),
      { type: 'defeated', combatantId: 'e1' },
      { type: 'combat-ended', outcome: 'victory' },
    ])
    // The player is the only one left, so any rule for the next turn gives 0.
    // This only shows that the index stays valid, not that it "stays".
    expect(state.turnIndex).toBe(0)
  })

  describe('moving the turn on', () => {
    it('goes to the next combatant in the order', () => {
      const { state } = resolvePlayerAttack(makeFight(5, 5), 'e2', hitRoll(3))

      expect(state.turnIndex).toBe(1)
    })

    it('skips a defeated combatant', () => {
      // e1 is already at 0 health, so the turn goes from the player to e2.
      const { state } = resolvePlayerAttack(makeFight(0, 5), 'e2', hitRoll(3))

      expect(state.turnIndex).toBe(2)
    })

    it('wraps around the end of the order', () => {
      // Order is e1, player, e2. The turn goes past the defeated e2 and
      // wraps around to e1.
      const fight: CombatState = {
        ...makeFight(5, 0),
        turnOrder: ['e1', PLAYER_ID, 'e2'],
        turnIndex: 1,
      }

      const { state } = resolvePlayerAttack(fight, 'e1', hitRoll(3))

      expect(state.turnIndex).toBe(0)
    })
  })

  // No random is passed on purpose: every check has to happen before any dice
  // are rolled. The checks run in this order: combat over, the player's turn,
  // then the target.
  it.each([
    {
      name: 'an unknown target id',
      fight: makeFight(5),
      targetId: 'unknown',
      message: 'Unknown target id',
    },
    {
      name: 'a defeated target',
      fight: makeFight(0, 5),
      targetId: 'e1',
      message: 'Target is already defeated',
    },
    {
      name: "when it isn't the player's turn",
      fight: { ...makeFight(5), turnIndex: 1 },
      targetId: 'e1',
      message: "It's not the player's turn",
    },
    {
      name: 'when all enemies are defeated',
      fight: makeFight(0),
      targetId: 'e1',
      message: 'Combat is already over',
    },
    {
      name: 'when the player is defeated',
      fight: { ...makeFight(5), player: makeCombatant({ currentHealth: 0 }) },
      targetId: 'e1',
      message: 'Combat is already over',
    },
  ])('throws on $name', ({ fight, targetId, message }) => {
    expect(() => resolvePlayerAttack(fight, targetId)).toThrow(message)
  })

  it('does not change the state passed in', () => {
    // Two enemies, so that reordering or editing them would show.
    const fight = makeFight(5, 3)
    const fightBefore = structuredClone(fight)

    resolvePlayerAttack(fight, 'e2', hitRoll(5))

    expect(fight).toEqual(fightBefore)
  })
})

describe('resolveEnemyTurns', () => {
  // A 5 + 3 = 8 misses the player's armor class 12, and no damage die is rolled.
  const miss = rollOf(5, 20)

  // Matches an attack event by its attacker only, for tests about who acted.
  const attackBy = (attackerId: string) =>
    expect.objectContaining({ type: 'attack', attackerId })

  it('lowers the player on a hit and emits an attack event', () => {
    const { state, events } = resolveEnemyTurns(makeEnemyTurn(5), hitRoll(3))

    expect(state.player.currentHealth).toBe(2)
    expect(events).toEqual([enemyHitEvent('e1', 3)])
  })

  it('does not lower health on a miss, but still emits an attack event', () => {
    const { state, events } = resolveEnemyTurns(
      makeEnemyTurn(5),
      sequence(miss),
    )

    expect(state.player.currentHealth).toBe(5)
    expect(events).toEqual([
      {
        type: 'attack',
        attackerId: 'e1',
        targetId: PLAYER_ID,
        result: {
          hit: false,
          naturalRoll: 5,
          total: 8,
          opposingArmorClass: 12,
          natural1: false,
        },
      },
    ])
  })

  it('has the enemies act in order, then hands the turn to the player', () => {
    const { state, events } = resolveEnemyTurns(
      makeEnemyTurn(5, 5),
      sequence(miss, miss),
    )

    expect(events).toEqual([attackBy('e1'), attackBy('e2')])
    expect(state.turnIndex).toBe(0)
  })

  it('stops at the player after the first enemy acts', () => {
    // Order is e1, player, e2, and it's e1's turn.
    const fight: CombatState = {
      ...makeFight(5, 5),
      turnOrder: ['e1', PLAYER_ID, 'e2'],
      turnIndex: 0,
    }

    const { state, events } = resolveEnemyTurns(fight, sequence(miss))

    expect(events).toEqual([attackBy('e1')])
    expect(state.turnIndex).toBe(1)
  })

  it('wraps around the end of the order', () => {
    // Order is e1, player, e2, and it's e2's turn. After e2 the turn wraps
    // around to e1, and then reaches the player.
    const fight: CombatState = {
      ...makeFight(5, 5),
      turnOrder: ['e1', PLAYER_ID, 'e2'],
      turnIndex: 2,
    }

    const { state, events } = resolveEnemyTurns(fight, sequence(miss, miss))

    expect(events).toEqual([attackBy('e2'), attackBy('e1')])
    expect(state.turnIndex).toBe(1)
  })

  it('skips a defeated enemy', () => {
    // Order is player, e1, e2, e3, and e2 is already defeated.
    const { state, events } = resolveEnemyTurns(
      makeEnemyTurn(5, 0, 5),
      sequence(miss, miss),
    )

    expect(events).toEqual([attackBy('e1'), attackBy('e3')])
    expect(state.turnIndex).toBe(0)
  })

  it('ends the combat with a defeat when the player falls', () => {
    // 6 damage on 5 health: health stops at 0, not -1. Only e1's dice are
    // given, so if e2 acted, `sequence` would throw.
    const { state, events } = resolveEnemyTurns(makeEnemyTurn(5, 5), hitRoll(6))

    expect(events).toEqual([
      enemyHitEvent('e1', 6),
      { type: 'defeated', combatantId: PLAYER_ID },
      { type: 'combat-ended', outcome: 'defeat' },
    ])
    expect(state.player.currentHealth).toBe(0)
    // The combat is over, so the turn stays on the enemy that struck the last
    // blow. Moving on would have given e2's turn (index 2).
    expect(state.turnIndex).toBe(1)
  })

  it("does nothing when it's already the player's turn", () => {
    // No random is passed on purpose: no dice may be rolled.
    const fight = makeFight(5, 5)

    const { state, events } = resolveEnemyTurns(fight)

    expect(state).toEqual(fight)
    expect(events).toEqual([])
  })

  it.each([
    { name: 'all enemies are defeated', fight: makeEnemyTurn(0, 0) },
    {
      name: 'the player is defeated',
      fight: {
        ...makeEnemyTurn(5),
        player: makeCombatant({ currentHealth: 0 }),
      },
    },
  ])('throws when $name', ({ fight }) => {
    expect(() => resolveEnemyTurns(fight)).toThrow('Combat is already over')
  })

  it('does not change the state passed in', () => {
    // Two enemies who both hit for 1, so that editing or reordering would show.
    const random = sequence(
      rollOf(15, 20),
      rollOf(1, 6),
      rollOf(15, 20),
      rollOf(1, 6),
    )
    const fight = makeEnemyTurn(5, 3)
    const fightBefore = structuredClone(fight)

    resolveEnemyTurns(fight, random)

    expect(fight).toEqual(fightBefore)
  })
})
