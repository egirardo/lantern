import { describe, expect, it } from 'vitest'
import { tileNameForGid, tileNamesSchema } from './tile-names'

describe('tileNameForGid', () => {
  const table = {
    dungeon: {
      '1099': 'barrel',
      '5': 'table',
    },
  }

  it('finds a plain gid', () => {
    const name = tileNameForGid(1100, { name: 'dungeon', firstgid: 1 }, table)
    expect(name).toEqual('barrel')
  })

  it('finds a flipped gid', () => {
    const name = tileNameForGid(
      2147484748,
      { name: 'dungeon', firstgid: 1 },
      table,
    )
    expect(name).toEqual('barrel')
  })

  it('finds another firstgid', () => {
    const name = tileNameForGid(15, { name: 'dungeon', firstgid: 10 }, table)
    expect(name).toEqual('table')
  })

  it('returns undefined for gid 0', () => {
    const name = tileNameForGid(0, { name: 'dungeon', firstgid: 1 }, table)
    expect(name).toBeUndefined()
  })

  it('returns undefined for a tile with no name', () => {
    const name = tileNameForGid(1101, { name: 'dungeon', firstgid: 1 }, table)
    expect(name).toBeUndefined()
  })

  it('returns undefined for a tileset with no entry in the table', () => {
    const name = tileNameForGid(1100, { name: 'dungeon', firstgid: 1 }, {})
    expect(name).toBeUndefined()
  })
})

describe('tileNamesSchema', () => {
  it('accepts a valid table', () => {
    const table = {
      dungeon: {
        '1099': 'barrel',
        '5': 'table',
      },
    }
    expect(() => tileNamesSchema.parse(table)).not.toThrow()
  })

  it('rejects a key that is not a whole number', () => {
    const table = {
      dungeon: {
        abc: 'barrel',
      },
    }
    expect(() => tileNamesSchema.parse(table)).toThrow()
  })

  // Added by Claude Code: the lookup uses String(1099), so a key like
  // "01099" would never match, and the barrel would silently have no name.
  it('rejects a key with a leading zero', () => {
    const table = {
      dungeon: {
        '01099': 'barrel',
      },
    }
    expect(() => tileNamesSchema.parse(table)).toThrow()
  })

  // Added by Claude Code: 0 is a real local id (the first tile in the
  // tileset), so the leading-zero rule must still allow "0" on its own.
  it('accepts the key 0', () => {
    const table = {
      dungeon: {
        '0': 'barrel',
      },
    }
    expect(() => tileNamesSchema.parse(table)).not.toThrow()
  })

  it('rejects a name that is not kebab-case', () => {
    const table = {
      dungeon: {
        '1099': 'Barrel',
      },
    }
    expect(() => tileNamesSchema.parse(table)).toThrow()
  })

  it('rejects an unknown tileset name', () => {
    const table = {
      unknown: {
        '1099': 'barrel',
      },
    }
    expect(() => tileNamesSchema.parse(table)).toThrow()
  })

  it('accepts multi-word kebab-case', () => {
    const table = {
      dungeon: {
        '1099': 'wooden-table',
      },
    }
    expect(() => tileNamesSchema.parse(table)).not.toThrow()
  })
})
