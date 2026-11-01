import { describe, expect, it } from 'vitest'
import { getAdjacentEnemies } from './adjacency'
import type { Position } from './movement'
import type { StoreEnemy } from './spawn-enemies'

function makeEnemy(id: string, position: Position): StoreEnemy {
  return {
    id,
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
    position,
  }
}

describe('getAdjacentEnemies', () => {
  it.each([
    { offset: { x: 0, y: -1 }, direction: 'north' },
    { offset: { x: 0, y: 1 }, direction: 'south' },
    { offset: { x: 1, y: 0 }, direction: 'east' },
    { offset: { x: -1, y: 0 }, direction: 'west' },
  ])('finds an enemy to the $direction', ({ offset }) => {
    const position = { x: 5, y: 5 }
    const enemyPosition = {
      x: position.x + offset.x,
      y: position.y + offset.y,
    }
    const enemies = [makeEnemy('e1', enemyPosition)]
    const adjacent = getAdjacentEnemies(position, enemies)
    expect(adjacent).toEqual([enemies[0]])
  })

  it('does not find a diagonal enemy', () => {
    const position = { x: 5, y: 5 }
    const enemies = [makeEnemy('e1', { x: 6, y: 6 })]
    const adjacent = getAdjacentEnemies(position, enemies)
    expect(adjacent).toEqual([])
  })

  it('does not find an enemy two tiles away', () => {
    const position = { x: 5, y: 5 }
    const enemies = [makeEnemy('e1', { x: 5, y: 7 })]
    const adjacent = getAdjacentEnemies(position, enemies)
    expect(adjacent).toEqual([])
  })

  it('does not find an enemy on the same tile', () => {
    const position = { x: 5, y: 5 }
    const enemies = [makeEnemy('e1', { x: 5, y: 5 })]
    const adjacent = getAdjacentEnemies(position, enemies)
    expect(adjacent).toEqual([])
  })

  it('finds several adjacent enemies and leaves out a far one', () => {
    const position = { x: 5, y: 5 }
    const enemies = [
      makeEnemy('e1', { x: 5, y: 4 }), // north
      makeEnemy('e2', { x: 5, y: 6 }), // south
      makeEnemy('e3', { x: 6, y: 5 }), // east
      makeEnemy('e4', { x: 4, y: 5 }), // west
      makeEnemy('e5', { x: 7, y: 5 }), // far east
    ]
    const adjacent = getAdjacentEnemies(position, enemies)
    expect(adjacent).toEqual([enemies[0], enemies[1], enemies[2], enemies[3]])
    expect(adjacent[0]).toBe(enemies[0])
    expect(adjacent[3]).toBe(enemies[3])
  })

  it('returns an empty list when there are no enemies', () => {
    const position = { x: 5, y: 5 }
    const enemies: StoreEnemy[] = []
    const adjacent = getAdjacentEnemies(position, enemies)
    expect(adjacent).toEqual([])
  })
})
