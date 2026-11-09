import { describe, it, expect } from 'vitest'
import { itemDisplayName, pickUpItems, type StoreItem } from './items'

const key: StoreItem = {
  id: 'key-1',
  type: 'gold-key',
  position: { x: 2, y: 1 },
}

describe('itemDisplayName', () => {
  it('gives the display name from items.json', () => {
    expect(itemDisplayName('gold-key')).toBe('gold key')
  })

  it('reads the table it is given', () => {
    const table = { 'golden-amulet': { displayName: 'golden amulet' } }
    expect(itemDisplayName('golden-amulet', table)).toBe('golden amulet')
  })

  it('throws for an unknown type, because that is a bug', () => {
    expect(() => itemDisplayName('golden-key')).toThrow(
      'Unknown item type golden-key',
    )
  })
})

describe('pickUpItems', () => {
  it('picks up the item on the tile: removes it, adds its type and says so', () => {
    const result = pickUpItems([key], { x: 2, y: 1 }, [])
    expect(result.items).toEqual([])
    expect(result.inventory).toEqual(['gold-key'])
    expect(result.lines).toEqual([
      { text: 'You pick up a gold key.', urgency: 'polite' },
    ])
  })

  it('leaves an item on another tile where it is', () => {
    const items = [key]
    const inventory: string[] = []
    const result = pickUpItems(items, { x: 1, y: 1 }, inventory)
    expect(result.lines).toEqual([])
    // The same arrays come back, not copies, so the store (and the Phaser
    // scene that compares old and new) sees that nothing changed.
    expect(result.items).toBe(items)
    expect(result.inventory).toBe(inventory)
  })

  it('only picks up the item on the tile, and keeps the others in order', () => {
    const first: StoreItem = { ...key, id: 'key-1', position: { x: 0, y: 1 } }
    const second: StoreItem = { ...key, id: 'key-2', position: { x: 4, y: 1 } }
    const result = pickUpItems([first, key, second], { x: 2, y: 1 }, [])
    expect(result.items).toEqual([first, second])
  })

  it('adds to what the player already carries, at the end', () => {
    const result = pickUpItems([key], { x: 2, y: 1 }, ['gold-key'])
    expect(result.inventory).toEqual(['gold-key', 'gold-key'])
  })

  it('picks up every item on the tile, with one line each', () => {
    const other: StoreItem = { ...key, id: 'key-2' }
    const result = pickUpItems([key, other], { x: 2, y: 1 }, [])
    expect(result.items).toEqual([])
    expect(result.inventory).toEqual(['gold-key', 'gold-key'])
    expect(result.lines.map((line) => line.text)).toEqual([
      'You pick up a gold key.',
      'You pick up a gold key.',
    ])
  })

  it('does not change the lists it is given', () => {
    const items = [key]
    const inventory = ['gold-key']
    pickUpItems(items, { x: 2, y: 1 }, inventory)
    expect(items).toEqual([key])
    expect(inventory).toEqual(['gold-key'])
  })
})
