import { describe, it, expect } from 'vitest'
import { items, itemSchema, itemTableSchema, isItemType } from './item-schema'

describe('items table', () => {
  it('contains the rusty key with its display name', () => {
    expect(items['rusty-key']?.displayName).toBe('rusty key')
  })
})

describe('itemSchema', () => {
  it('accepts a valid item', () => {
    const result = itemSchema.safeParse({ displayName: 'rusty key' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty display name', () => {
    const result = itemSchema.safeParse({ displayName: '   ' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['displayName'])
  })

  it('rejects an unknown extra field', () => {
    const result = itemSchema.safeParse({
      displayName: 'rusty key',
      weight: 1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.code).toBe('unrecognized_keys')
  })
})

describe('itemTableSchema', () => {
  it('rejects a key that is not kebab-case', () => {
    const result = itemTableSchema.safeParse({
      'Rusty Key': { displayName: 'rusty key' },
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['Rusty Key'])
  })
})

describe('isItemType', () => {
  it('is true for a type in items.json', () => {
    expect(isItemType('rusty-key')).toBe(true)
  })

  it('is false for an unknown type', () => {
    expect(isItemType('golden-key')).toBe(false)
  })

  it('is false for a name every object inherits', () => {
    expect(isItemType('toString')).toBe(false)
  })
})
