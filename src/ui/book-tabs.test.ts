import { describe, it, expect } from 'vitest'
import { tabForKey } from './book-tabs'

describe('tabForKey', () => {
  it('moves down to the next tab', () => {
    expect(tabForKey('help', 'ArrowDown')).toBe('settings')
    expect(tabForKey('settings', 'ArrowDown')).toBe('account')
  })

  it('moves up to the previous tab', () => {
    expect(tabForKey('account', 'ArrowUp')).toBe('settings')
    expect(tabForKey('settings', 'ArrowUp')).toBe('help')
  })

  it('wraps around at both ends', () => {
    expect(tabForKey('account', 'ArrowDown')).toBe('help')
    expect(tabForKey('help', 'ArrowUp')).toBe('account')
  })

  it('treats Right and Left like Down and Up, for the tabs in a row', () => {
    expect(tabForKey('help', 'ArrowRight')).toBe('settings')
    expect(tabForKey('help', 'ArrowLeft')).toBe('account')
  })

  it('goes to the first tab with Home and the last with End', () => {
    expect(tabForKey('settings', 'Home')).toBe('help')
    expect(tabForKey('settings', 'End')).toBe('account')
  })

  it('leaves other keys alone', () => {
    expect(tabForKey('settings', 'Tab')).toBeNull()
    expect(tabForKey('settings', 'Enter')).toBeNull()
    expect(tabForKey('settings', 'a')).toBeNull()
  })
})
