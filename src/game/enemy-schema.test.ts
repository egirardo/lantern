import { describe, it, expect } from 'vitest'
import { enemies, enemySchema, enemyTableSchema } from './enemy-schema'

describe('enemies table', () => {
  it('contains skeleton, demon and orc', () => {
    expect(Object.keys(enemies)).toEqual(
      expect.arrayContaining(['skeleton', 'demon', 'orc']),
    )
  })

  it('gives every enemy a numeric damage die', () => {
    for (const enemy of Object.values(enemies)) {
      expect(typeof enemy.damageDie).toBe('number')
    }
  })
})

const validEnemy = {
  maxHealth: 4,
  armorClass: 10,
  initiativeBonus: 1,
  attackBonus: 2,
  damageDie: 4,
  displayName: 'skeleton',
}

describe('enemySchema', () => {
  it('accepts a valid enemy', () => {
    const result = enemySchema.safeParse(validEnemy)
    expect(result.success).toBe(true)
  })

  it('rejects an enemy with a missing field', () => {
    const enemyWithoutField: Partial<typeof validEnemy> = { ...validEnemy }
    delete enemyWithoutField.maxHealth
    const result = enemySchema.safeParse(enemyWithoutField)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['maxHealth'])
  })

  it('rejects an enemy with an unknown extra field', () => {
    const enemyWithExtraField = { ...validEnemy, armourClass: 10 }
    const result = enemySchema.safeParse(enemyWithExtraField)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.code).toBe('unrecognized_keys')
  })

  it('rejects an enemy with zero max health', () => {
    const enemyWithZeroHealth = { ...validEnemy, maxHealth: 0 }
    const result = enemySchema.safeParse(enemyWithZeroHealth)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['maxHealth'])
  })

  it('rejects an empty display name', () => {
    const enemyWithEmptyName = { ...validEnemy, displayName: '   ' }
    const result = enemySchema.safeParse(enemyWithEmptyName)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['displayName'])
  })
})

describe('enemyTableSchema', () => {
  it('rejects a key that is not kebab-case', () => {
    const invalidTable = { 'Giant Rat': validEnemy }
    const result = enemyTableSchema.safeParse(invalidTable)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['Giant Rat'])
  })
})
