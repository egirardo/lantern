import { describe, expect, it } from 'vitest'
import { syncFromCombat } from './combat-sync'
import { makeCombatant, makeState, makeStoreEnemy } from './test-helpers'

// A skeleton in the store with 5 HP. It's a function, not a shared constant,
// so every test gets a fresh object and a buggy implementation that changes
// it can't leak into the next test.
function makeSkeleton() {
  return makeStoreEnemy('e1', {
    type: 'skeleton',
    position: { x: 4, y: 2 },
    combatant: makeCombatant({ currentHealth: 5 }),
  })
}

describe('syncFromCombat', () => {
  it('copies the player from the combat', () => {
    const combatPlayer = makeCombatant({ name: 'Hero', currentHealth: 7 })
    const combat = makeState({ player: combatPlayer, enemies: [] })

    const result = syncFromCombat([], combat)

    expect(result.player).toEqual(combatPlayer)
  })

  it("keeps a surviving enemy's id, type and position and takes its combatant from the combat", () => {
    const combat = makeState({
      enemies: [{ id: 'e1', combatant: makeCombatant({ currentHealth: 2 }) }],
    })

    const result = syncFromCombat([makeSkeleton()], combat)

    expect(result.enemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        position: { x: 4, y: 2 },
        combatant: makeCombatant({ currentHealth: 2 }),
      },
    ])
  })

  it('removes an enemy that is at 0 health', () => {
    const combat = makeState({
      enemies: [{ id: 'e1', combatant: makeCombatant({ currentHealth: 0 }) }],
    })

    const result = syncFromCombat([makeSkeleton()], combat)

    expect(result.enemies).toEqual([])
  })

  it('keeps an enemy that is not in the combat exactly as it was', () => {
    const combat = makeState({
      enemies: [{ id: 'e1', combatant: makeCombatant({ currentHealth: 2 }) }],
    })
    const orc = makeStoreEnemy('e2', {
      type: 'orc',
      position: { x: 5, y: 3 },
      combatant: makeCombatant({ currentHealth: 6 }),
    })

    const result = syncFromCombat([makeSkeleton(), orc], combat)

    expect(result.enemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        position: { x: 4, y: 2 },
        combatant: makeCombatant({ currentHealth: 2 }),
      },
      {
        id: 'e2',
        type: 'orc',
        position: { x: 5, y: 3 },
        combatant: makeCombatant({ currentHealth: 6 }),
      },
    ])
  })

  it('removes defeated enemies, updates hurt ones and keeps the rest, in order', () => {
    // e1 is hurt, e2 is defeated, e3 is not in the combat.
    const combat = makeState({
      enemies: [
        { id: 'e1', combatant: makeCombatant({ currentHealth: 2 }) },
        { id: 'e2', combatant: makeCombatant({ currentHealth: 0 }) },
      ],
    })
    const orc = makeStoreEnemy('e2', {
      type: 'orc',
      position: { x: 5, y: 3 },
      combatant: makeCombatant({ currentHealth: 6 }),
    })
    const demon = makeStoreEnemy('e3', {
      type: 'demon',
      position: { x: 6, y: 4 },
      combatant: makeCombatant({ currentHealth: 7 }),
    })

    const result = syncFromCombat([makeSkeleton(), orc, demon], combat)

    expect(result.enemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        position: { x: 4, y: 2 },
        combatant: makeCombatant({ currentHealth: 2 }),
      },
      {
        id: 'e3',
        type: 'demon',
        position: { x: 6, y: 4 },
        combatant: makeCombatant({ currentHealth: 7 }),
      },
    ])
  })

  it('does not change its inputs', () => {
    // Two enemies, one of them defeated, so removing it from the input array
    // (e.g. with splice) would show up. One enemy alone can't catch that.
    const enemies = [
      makeSkeleton(),
      makeStoreEnemy('e2', { combatant: makeCombatant({ currentHealth: 6 }) }),
    ]
    const combat = makeState({
      player: makeCombatant({ name: 'Hero', currentHealth: 7 }),
      enemies: [
        { id: 'e1', combatant: makeCombatant({ currentHealth: 2 }) },
        { id: 'e2', combatant: makeCombatant({ currentHealth: 0 }) },
      ],
    })
    const enemiesBefore = structuredClone(enemies)
    const combatBefore = structuredClone(combat)

    syncFromCombat(enemies, combat)

    expect(enemies).toEqual(enemiesBefore)
    expect(combat).toEqual(combatBefore)
  })
})
