import { describe, it, expect } from 'vitest'
import { PLAYER } from '../game/player'
import type { CombatState } from '../game/combat'
import type { Room } from '../rooms/room-schema'
import { validRoom } from '../rooms/testing-map'
import {
  buildEnded,
  buildSave,
  chooseNewest,
  newGameContent,
  sameContent,
  sameSettings,
  saveAction,
  saveContent,
  shouldPush,
  type SaveMoment,
  type SaveSource,
} from './save-rules'

const source: SaveSource = {
  currentRoomId: 'room-1',
  enteredFrom: 'room-2',
  player: { ...PLAYER, currentHealth: 4 },
  inventory: ['gold-key'],
  foundLockedExit: true,
  takenItemIds: ['room-2/key-1'],
  defeatedEnemyIds: ['room-2/e1'],
}

const now = new Date('2026-11-09T10:00:00.000Z')

// Only "a fight is going on" matters to these rules, not what's in it, so
// any object will do. The cast says so instead of building a whole fight.
const someFight = {} as CombatState

// A moment where saving is allowed: room-1 loaded, no fight, alive.
const calm: SaveMoment = {
  room: validRoom,
  currentRoomId: 'room-1',
  combat: null,
  player: PLAYER,
  hasEscaped: false,
}

describe('buildSave', () => {
  it('copies the saved fields from the state, with the version and time', () => {
    expect(buildSave(source, now)).toEqual({
      version: 1,
      currentRoomId: 'room-1',
      enteredFrom: 'room-2',
      health: 4,
      inventory: ['gold-key'],
      foundLockedExit: true,
      takenItemIds: ['room-2/key-1'],
      defeatedEnemyIds: ['room-2/e1'],
      updatedAt: '2026-11-09T10:00:00.000Z',
    })
  })
})

describe('buildEnded', () => {
  it('says the game has ended, and when', () => {
    expect(buildEnded(now)).toEqual({
      version: 1,
      ended: true,
      updatedAt: '2026-11-09T10:00:00.000Z',
    })
  })
})

describe('sameContent', () => {
  const content = saveContent(source)

  it('is true for the same progress', () => {
    expect(sameContent(content, { ...content })).toBe(true)
  })

  it('is false when any field differs', () => {
    expect(sameContent(content, { ...content, health: 5 })).toBe(false)
    expect(sameContent(content, { ...content, enteredFrom: null })).toBe(false)
    expect(sameContent(content, { ...content, currentRoomId: 'room-3' })).toBe(
      false,
    )
    expect(sameContent(content, { ...content, inventory: [] })).toBe(false)
    expect(sameContent(content, { ...content, foundLockedExit: false })).toBe(
      false,
    )
    expect(
      sameContent(content, { ...content, takenItemIds: ['room-2/key-2'] }),
    ).toBe(false)
    expect(
      sameContent(content, {
        ...content,
        defeatedEnemyIds: ['room-2/e1', 'room-1/e1'],
      }),
    ).toBe(false)
  })

  it('a new game is the same as the state of a fresh store', () => {
    const fresh: SaveSource = {
      currentRoomId: 'entrance-hall',
      enteredFrom: null,
      player: PLAYER,
      inventory: [],
      foundLockedExit: false,
      takenItemIds: [],
      defeatedEnemyIds: [],
    }
    expect(
      sameContent(
        saveContent(fresh),
        newGameContent('entrance-hall', PLAYER.maxHealth),
      ),
    ).toBe(true)
  })
})

describe('sameSettings', () => {
  const settings = {
    reducedMotion: false,
    highContrast: false,
    textSize: 'normal',
    logVerbosity: 'verbose',
  } as const

  it('compares every setting', () => {
    expect(sameSettings(settings, { ...settings })).toBe(true)
    expect(sameSettings(settings, { ...settings, reducedMotion: true })).toBe(
      false,
    )
    expect(sameSettings(settings, { ...settings, highContrast: true })).toBe(
      false,
    )
    expect(sameSettings(settings, { ...settings, textSize: 'large' })).toBe(
      false,
    )
    expect(sameSettings(settings, { ...settings, logVerbosity: 'brief' })).toBe(
      false,
    )
  })
})

describe('saveAction', () => {
  it('saves when a room is loaded and there is no fight', () => {
    expect(saveAction(calm)).toBe('save')
  })

  it('waits during a fight', () => {
    expect(saveAction({ ...calm, combat: someFight })).toBe('wait')
  })

  it('waits before the first room has loaded', () => {
    expect(saveAction({ ...calm, room: null })).toBe('wait')
  })

  it('waits between an exit and the next room loading', () => {
    expect(saveAction({ ...calm, currentRoomId: 'room-2' })).toBe('wait')
  })

  it('ends the game at 0 health, also with the fight already over', () => {
    const fallen = { ...PLAYER, currentHealth: 0 }
    expect(saveAction({ ...calm, player: fallen })).toBe('end')
    expect(saveAction({ ...calm, player: fallen, combat: someFight })).toBe(
      'end',
    )
  })

  it('ends the game after the escape', () => {
    expect(saveAction({ ...calm, hasEscaped: true })).toBe('end')
  })
})

describe('shouldPush', () => {
  const room2: Room = { ...validRoom, id: 'room-2' }

  it('pushes when a room has finished loading', () => {
    expect(shouldPush({ ...calm, room: null }, calm)).toBe(true)
    expect(shouldPush(calm, { ...calm, room: room2 })).toBe(true)
  })

  it('pushes when a fight ends', () => {
    expect(shouldPush({ ...calm, combat: someFight }, calm)).toBe(true)
  })

  it('pushes when the player escapes', () => {
    expect(shouldPush(calm, { ...calm, hasEscaped: true })).toBe(true)
  })

  it('does not push on an ordinary change', () => {
    expect(shouldPush(calm, { ...calm })).toBe(false)
    // A fight starting is not a moment to push.
    expect(shouldPush(calm, { ...calm, combat: someFight })).toBe(false)
    // The same room loaded again (a restore) is not a room change.
    expect(shouldPush(calm, { ...calm, room: { ...validRoom } })).toBe(false)
  })
})

describe('chooseNewest', () => {
  const older = '2026-11-09T09:00:00.000Z'
  const newer = '2026-11-09T10:00:00.000Z'

  it('picks the newer copy', () => {
    expect(chooseNewest(newer, older)).toBe('local')
    expect(chooseNewest(older, newer)).toBe('remote')
  })

  it('picks the side that has a copy when the other has none', () => {
    expect(chooseNewest(older, null)).toBe('local')
    expect(chooseNewest(null, older)).toBe('remote')
    expect(chooseNewest(null, null)).toBe('same')
  })

  it('compares moments, not text', () => {
    // The same moment written two ways: equal, so nothing to copy.
    expect(chooseNewest(newer, '2026-11-09T10:00:00+00:00')).toBe('same')
    // As text, "…T10:00:00+01:00" sorts after "…T09:30:00Z", but it is
    // 09:00 UTC, so earlier.
    expect(
      chooseNewest('2026-11-09T09:30:00Z', '2026-11-09T10:00:00+01:00'),
    ).toBe('local')
  })
})
