import { describe, it, expect } from 'vitest'
import { spawnEnemies } from './spawn-enemies'

describe('spawnEnemies', () => {
  const table = {
    skeleton: {
      displayName: 'skeleton',
      maxHealth: 10,
      armorClass: 12,
      attackBonus: 2,
      initiativeBonus: 1,
      damageDie: 6,
    },
    orc: {
      displayName: 'orc',
      maxHealth: 15,
      armorClass: 13,
      attackBonus: 3,
      initiativeBonus: 0,
      damageDie: 8,
    },
  }

  it('gives one enemy the right stats', () => {
    const roomEnemies = [
      { id: 'e1', type: 'skeleton', position: { x: 1, y: 1 } },
    ]
    const storeEnemies = spawnEnemies(roomEnemies, table)
    expect(storeEnemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        combatant: {
          name: 'skeleton',
          maxHealth: 10,
          currentHealth: 10,
          armorClass: 12,
          attackBonus: 2,
          initiativeBonus: 1,
          damageDie: 6,
        },
        position: { x: 1, y: 1 },
      },
    ])
  })

  it('gives two enemies of the same type numbers', () => {
    const roomEnemies = [
      { id: 'e1', type: 'skeleton', position: { x: 1, y: 1 } },
      { id: 'e2', type: 'skeleton', position: { x: 2, y: 2 } },
    ]
    const storeEnemies = spawnEnemies(roomEnemies, table)
    expect(storeEnemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        combatant: {
          name: 'skeleton 1',
          maxHealth: 10,
          currentHealth: 10,
          armorClass: 12,
          attackBonus: 2,
          initiativeBonus: 1,
          damageDie: 6,
        },
        position: { x: 1, y: 1 },
      },
      {
        id: 'e2',
        type: 'skeleton',
        combatant: {
          name: 'skeleton 2',
          maxHealth: 10,
          currentHealth: 10,
          armorClass: 12,
          attackBonus: 2,
          initiativeBonus: 1,
          damageDie: 6,
        },
        position: { x: 2, y: 2 },
      },
    ])
  })

  it('numbers only the duplicates', () => {
    const roomEnemies = [
      { id: 'e1', type: 'skeleton', position: { x: 1, y: 1 } },
      { id: 'e2', type: 'orc', position: { x: 2, y: 2 } },
      { id: 'e3', type: 'orc', position: { x: 3, y: 3 } },
    ]
    const storeEnemies = spawnEnemies(roomEnemies, table)
    expect(storeEnemies).toEqual([
      {
        id: 'e1',
        type: 'skeleton',
        combatant: {
          name: 'skeleton',
          maxHealth: 10,
          currentHealth: 10,
          armorClass: 12,
          attackBonus: 2,
          initiativeBonus: 1,
          damageDie: 6,
        },
        position: { x: 1, y: 1 },
      },
      {
        id: 'e2',
        type: 'orc',
        combatant: {
          name: 'orc 1',
          maxHealth: 15,
          currentHealth: 15,
          armorClass: 13,
          attackBonus: 3,
          initiativeBonus: 0,
          damageDie: 8,
        },
        position: { x: 2, y: 2 },
      },
      {
        id: 'e3',
        type: 'orc',
        combatant: {
          name: 'orc 2',
          maxHealth: 15,
          currentHealth: 15,
          armorClass: 13,
          attackBonus: 3,
          initiativeBonus: 0,
          damageDie: 8,
        },
        position: { x: 3, y: 3 },
      },
    ])
  })

  it('numbers in room order', () => {
    const roomEnemies = [
      { id: 'e1', type: 'orc', position: { x: 1, y: 1 } },
      { id: 'e2', type: 'skeleton', position: { x: 2, y: 2 } },
      { id: 'e3', type: 'orc', position: { x: 3, y: 3 } },
    ]
    const storeEnemies = spawnEnemies(roomEnemies, table)
    expect(storeEnemies).toEqual([
      {
        id: 'e1',
        type: 'orc',
        combatant: {
          name: 'orc 1',
          maxHealth: 15,
          currentHealth: 15,
          armorClass: 13,
          attackBonus: 3,
          initiativeBonus: 0,
          damageDie: 8,
        },
        position: { x: 1, y: 1 },
      },
      {
        id: 'e2',
        type: 'skeleton',
        combatant: {
          name: 'skeleton',
          maxHealth: 10,
          currentHealth: 10,
          armorClass: 12,
          attackBonus: 2,
          initiativeBonus: 1,
          damageDie: 6,
        },
        position: { x: 2, y: 2 },
      },
      {
        id: 'e3',
        type: 'orc',
        combatant: {
          name: 'orc 2',
          maxHealth: 15,
          currentHealth: 15,
          armorClass: 13,
          attackBonus: 3,
          initiativeBonus: 0,
          damageDie: 8,
        },
        position: { x: 3, y: 3 },
      },
    ])
  })

  it('returns an empty list for an empty input', () => {
    const storeEnemies = spawnEnemies([], table)
    expect(storeEnemies).toEqual([])
  })

  it('throws for an unknown type', () => {
    const roomEnemies = [
      { id: 'e1', type: 'unknown', position: { x: 1, y: 1 } },
    ]
    expect(() => spawnEnemies(roomEnemies, table)).toThrow(
      'Unknown enemy type: unknown',
    )
  })

  it('does not change the input array', () => {
    const roomEnemies = [
      { id: 'e1', type: 'skeleton', position: { x: 1, y: 1 } },
      { id: 'e2', type: 'skeleton', position: { x: 2, y: 2 } },
    ]
    const frozenRoomEnemies = Object.freeze([...roomEnemies])
    spawnEnemies(frozenRoomEnemies, table)
    expect(frozenRoomEnemies).toEqual(roomEnemies)
  })
})
