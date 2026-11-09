import { describe, it, expect } from 'vitest'
import {
  settingsSchema,
  TEXT_SCALES,
  type Settings,
  defaultSettings,
} from './settings'

const validSettings: Settings = {
  reducedMotion: false,
  highContrast: true,
  textSize: 'large',
  logVerbosity: 'brief',
}

describe('settingsSchema', () => {
  it('accepts valid settings', () => {
    expect(settingsSchema.parse(validSettings)).toEqual(validSettings)
  })

  it('rejects an unknown field', () => {
    expect(() =>
      settingsSchema.parse({ ...validSettings, music: true }),
    ).toThrow()
  })

  it('rejects a missing field', () => {
    const withoutHighContrast = {
      reducedMotion: false,
      textSize: 'large',
      logVerbosity: 'brief',
    }
    expect(() => settingsSchema.parse(withoutHighContrast)).toThrow()
  })

  it('rejects a text size that is not one of the steps', () => {
    expect(() =>
      settingsSchema.parse({ ...validSettings, textSize: 'huge' }),
    ).toThrow()
  })

  it('rejects a verbosity that is not verbose or brief', () => {
    expect(() =>
      settingsSchema.parse({ ...validSettings, logVerbosity: 'quiet' }),
    ).toThrow()
  })
})

describe('TEXT_SCALES', () => {
  it('starts at 1 and grows with each step', () => {
    expect(TEXT_SCALES.normal).toBe(1)
    expect(TEXT_SCALES.large).toBeGreaterThan(TEXT_SCALES.normal)
    expect(TEXT_SCALES.larger).toBeGreaterThan(TEXT_SCALES.large)
    expect(TEXT_SCALES.largest).toBeGreaterThan(TEXT_SCALES.larger)
  })
})

describe('defaultSettings', () => {
  it('sets reducedMotion to the parameter', () => {
    expect(defaultSettings(true).reducedMotion).toBe(true)
    expect(defaultSettings(false).reducedMotion).toBe(false)
  })

  it('sets highContrast to false', () => {
    expect(defaultSettings(true).highContrast).toBe(false)
    expect(defaultSettings(false).highContrast).toBe(false)
  })

  it('sets textSize to normal', () => {
    expect(defaultSettings(true).textSize).toBe('normal')
    expect(defaultSettings(false).textSize).toBe('normal')
  })

  it('sets logVerbosity to verbose', () => {
    expect(defaultSettings(true).logVerbosity).toBe('verbose')
    expect(defaultSettings(false).logVerbosity).toBe('verbose')
  })
})
