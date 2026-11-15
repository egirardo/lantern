import { describe, it, expect } from 'vitest'
import { items, itemSchema, itemTableSchema, isItemType } from './item-schema'

describe('items table', () => {
  it('contains the gold key with its display name', () => {
    expect(items['gold-key']?.displayName).toBe('gold key')
  })
})

describe('itemSchema', () => {
  it('accepts a valid item', () => {
    const result = itemSchema.safeParse({ displayName: 'gold key' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty display name', () => {
    const result = itemSchema.safeParse({ displayName: '   ' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['displayName'])
  })

  it('rejects an unknown extra field', () => {
    const result = itemSchema.safeParse({
      displayName: 'gold key',
      weight: 1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.code).toBe('unrecognized_keys')
  })
})

describe('itemTableSchema', () => {
  it('rejects a key that is not kebab-case', () => {
    const result = itemTableSchema.safeParse({
      'Gold Key': { displayName: 'gold key' },
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['Gold Key'])
  })
})

describe('isItemType', () => {
  it('is true for a type in items.json', () => {
    expect(isItemType('gold-key')).toBe(true)
  })

  it('is false for an unknown type', () => {
    expect(isItemType('golden-key')).toBe(false)
  })

  it('is false for a name every object inherits', () => {
    expect(isItemType('toString')).toBe(false)
  })
})
