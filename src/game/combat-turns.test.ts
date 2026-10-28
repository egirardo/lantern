import { describe, it, expect } from 'vitest'
import { PLAYER_ID, type CombatEntry } from './combat'
import { startCombat } from './combat-turns'
import { makeCombatant, rollOf, sequence } from './test-helpers'

// An enemy entry with just the id, name and initiative bonus a test cares about.
function makeEnemy(id: string, initiativeBonus = 0): CombatEntry {
  return {
    id,
    combatant: makeCombatant({ name: `Enemy ${id}`, initiativeBonus }),
  }
}

// startCombat rolls one d20 per combatant: the player first, then the enemies
// in the order of the array. So in every test, the values given to `sequence`
// are: player, first enemy, second enemy, and so on.
describe('startCombat', () => {
  it('puts the highest initiative first', () => {
    // player rolls 10, e1 rolls 15
    const random = sequence(rollOf(10, 20), rollOf(15, 20))
    const player = makeCombatant({ name: 'Player' })

    const { state } = startCombat(player, [makeEnemy('e1')], random)

    expect(state.turnOrder).toEqual(['e1', PLAYER_ID])
    expect(state.turnIndex).toBe(0)
  })

  it('resolves a tie in favor of the player', () => {
    // player rolls 10, e1 rolls 10
    const random = sequence(rollOf(10, 20), rollOf(10, 20))
    const player = makeCombatant({ name: 'Player' })

    const { state } = startCombat(player, [makeEnemy('e1')], random)

    expect(state.turnOrder).toEqual([PLAYER_ID, 'e1'])
  })

  it("lets the player's bonus decide the order", () => {
    // player rolls 8 + 4 = 12, e1 rolls 10 + 0 = 10. Without the bonus, e1
    // would go first.
    const random = sequence(rollOf(8, 20), rollOf(10, 20))
    const player = makeCombatant({ name: 'Player', initiativeBonus: 4 })

    const { state } = startCombat(player, [makeEnemy('e1')], random)

    expect(state.turnOrder).toEqual([PLAYER_ID, 'e1'])
  })

  it("lets an enemy's bonus decide the order", () => {
    // player rolls 10 + 0 = 10, e1 rolls 8 + 4 = 12. Without the bonus, the
    // player would go first.
    const random = sequence(rollOf(10, 20), rollOf(8, 20))
    const player = makeCombatant({ name: 'Player' })

    const { state } = startCombat(player, [makeEnemy('e1', 4)], random)

    expect(state.turnOrder).toEqual(['e1', PLAYER_ID])
  })

  it('sorts three combatants', () => {
    // player rolls 12, e1 rolls 5, e2 rolls 18
    const random = sequence(rollOf(12, 20), rollOf(5, 20), rollOf(18, 20))
    const player = makeCombatant({ name: 'Player' })

    const { state } = startCombat(
      player,
      [makeEnemy('e1'), makeEnemy('e2')],
      random,
    )

    expect(state.turnOrder).toEqual(['e2', PLAYER_ID, 'e1'])
  })

  it('keeps the original order when two enemies tie', () => {
    // player rolls 5, e1 rolls 14, e2 rolls 14
    const random = sequence(rollOf(5, 20), rollOf(14, 20), rollOf(14, 20))
    const player = makeCombatant({ name: 'Player' })

    const { state } = startCombat(
      player,
      [makeEnemy('e1'), makeEnemy('e2')],
      random,
    )

    expect(state.turnOrder).toEqual(['e1', 'e2', PLAYER_ID])
  })

  it('returns one initiative event per combatant, in turn order', () => {
    // player rolls 10 + 2 = 12, e1 rolls 15 + 1 = 16
    const random = sequence(rollOf(10, 20), rollOf(15, 20))
    const player = makeCombatant({ name: 'Player', initiativeBonus: 2 })

    const { events } = startCombat(player, [makeEnemy('e1', 1)], random)

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
    const player = makeCombatant({ name: 'Player' })
    const enemies = [makeEnemy('e1')]

    const { state } = startCombat(player, enemies, random)

    expect(state.player).toEqual(player)
    expect(state.enemies).toEqual(enemies)
  })

  it('throws when there are no enemies', () => {
    // No random is passed on purpose: the check has to happen before any dice
    // are rolled.
    const player = makeCombatant({ name: 'Player' })

    expect(() => startCombat(player, [])).toThrow(
      'Cannot start combat with no enemies',
    )
  })

  it('does not change the player or enemies passed in', () => {
    const random = sequence(rollOf(10, 20), rollOf(15, 20), rollOf(18, 20))
    const player = makeCombatant({ name: 'Player' })
    const enemies = [makeEnemy('e1'), makeEnemy('e2')]
    const playerBefore = structuredClone(player)
    const enemiesBefore = structuredClone(enemies)

    startCombat(player, enemies, random)

    expect(player).toEqual(playerBefore)
    expect(enemies).toEqual(enemiesBefore)
  })
})
