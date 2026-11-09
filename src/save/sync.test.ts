import { describe, it, expect, vi, afterEach } from 'vitest'
import { PLAYER } from '../game/player'
import type { CombatState } from '../game/combat'
import type { Room } from '../rooms/room-schema'
import { validMap, validRoom } from '../rooms/testing-map'
import { createGameStore, FIRST_ROOM_ID } from '../state/game-store'
import type { Settings } from '../state/settings'
import { SAVE_KEY, SETTINGS_KEY } from './local-store'
import type { RemoteRecord } from './remote-store'
import type { EndedGame, Save, StoredSettings } from './save-schema'
import { startSaving, type SaveDeps } from './sync'
import { fakeStorage } from './test-storage'

// These tests run the real store and the real save code, with fakes for
// everything outside: localStorage (a Map), Supabase (fetch and push
// functions that remember their calls) and the auth state.

// The first room of a new game, so loading it is "nothing has happened yet".
const firstRoom: Room = { ...validRoom, id: FIRST_ROOM_ID }
// 'room-2' with an exit back to the first room.
const room2: Room = {
  ...validRoom,
  id: 'room-2',
  exits: [{ tiles: [{ x: 2, y: 0 }], to: FIRST_ROOM_ID }],
}

const someFight = {} as CombatState

const settings: Settings = {
  reducedMotion: false,
  highContrast: false,
  textSize: 'normal',
  logVerbosity: 'verbose',
}

function saveAt(updatedAt: string, changes: Partial<Save> = {}): Save {
  return {
    version: 1,
    currentRoomId: 'room-2',
    enteredFrom: FIRST_ROOM_ID,
    health: 6,
    inventory: ['gold-key'],
    takenItemIds: [`${FIRST_ROOM_ID}/key-1`],
    defeatedEnemyIds: [],
    updatedAt,
    ...changes,
  }
}

// Times in order, so "older" and "newer" read clearly in the tests. The fake
// clock below starts after all of them.
const EARLY = '2026-11-09T08:00:00.000Z'
const LATE = '2026-11-09T09:00:00.000Z'

type Setup = {
  localSave?: unknown
  localSettings?: StoredSettings
  remoteSave?: RemoteRecord | null
  remoteSettings?: RemoteRecord | null
  // The player signed in when the page loads, or null for a guest.
  user?: string | null
  fetchFails?: boolean
}

function setup({
  localSave,
  localSettings,
  remoteSave = null,
  remoteSettings = null,
  user = null,
  fetchFails = false,
}: Setup = {}) {
  const storage = fakeStorage()
  if (localSave !== undefined) {
    storage.values.set(SAVE_KEY, JSON.stringify(localSave))
  }
  if (localSettings !== undefined) {
    storage.values.set(SETTINGS_KEY, JSON.stringify(localSettings))
  }

  // vi.fn() makes a function that remembers how it was called, so the
  // tests can check which pushes were made.
  const fetchRemote = vi.fn(async (kind: 'save' | 'settings') => {
    if (fetchFails) throw new Error('Network down')
    return kind === 'save' ? remoteSave : remoteSettings
  })
  // Typed like the real pushRemote, so the tests can read its arguments.
  const pushRemote = vi.fn<SaveDeps['pushRemote']>(async () => {})

  let authCallback: (userId: string | null) => void = () => {}
  // A clock that moves one second on every call, starting at 10:00.
  let time = Date.parse('2026-11-09T10:00:00.000Z')

  const deps: SaveDeps = {
    storage,
    fetchRemote,
    pushRemote,
    onAuthChange: (callback) => {
      authCallback = callback
      // Like Supabase: once right away with the current state.
      callback(user)
      return () => {}
    },
    now: () => new Date((time += 1000)),
    // At once, so the tests don't need timers.
    later: (run) => run(),
  }

  const store = createGameStore(Math.random, settings)
  const session = startSaving(store, deps)

  return {
    store,
    session,
    storage,
    fetchRemote,
    pushRemote,
    setUser: (id: string | null) => authCallback(id),
    localSave: () => JSON.parse(storage.values.get(SAVE_KEY) ?? 'null'),
    localSettings: () => JSON.parse(storage.values.get(SETTINGS_KEY) ?? 'null'),
    pushedKinds: () => pushRemote.mock.calls.map((call) => call[0]),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('start-up from localStorage', () => {
  it('puts a valid local save in the store before any room loads', () => {
    const { store } = setup({ localSave: saveAt(EARLY) })
    const state = store.getState()
    expect(state.currentRoomId).toBe('room-2')
    expect(state.arrivingFrom).toBe(FIRST_ROOM_ID)
    expect(state.player.currentHealth).toBe(6)
    expect(state.inventory).toEqual(['gold-key'])
  })

  it('starts a new game from an old-version save, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { store } = setup({ localSave: { ...saveAt(EARLY), version: 0 } })
    expect(store.getState().currentRoomId).toBe(FIRST_ROOM_ID)
    expect(store.getState().player).toEqual(PLAYER)
    expect(warn).toHaveBeenCalled()
  })

  it('starts a new game after an ended game', () => {
    const ended: EndedGame = { version: 1, ended: true, updatedAt: EARLY }
    const { store } = setup({ localSave: ended })
    expect(store.getState().currentRoomId).toBe(FIRST_ROOM_ID)
  })

  it('puts the local settings in the store', () => {
    const stored = {
      settings: { ...settings, textSize: 'largest' as const },
      updatedAt: EARLY,
    }
    const { store, localSettings } = setup({ localSettings: stored })
    expect(store.getState().settings.textSize).toBe('largest')
    // Loading them isn't a change: they keep their time.
    expect(localSettings()).toEqual(stored)
  })
})

describe('saving to localStorage', () => {
  it('does not save a new game that has only loaded its first room', () => {
    const { store, storage } = setup()
    store.getState().loadRoom(firstRoom, validMap)
    expect(storage.values.has(SAVE_KEY)).toBe(false)
  })

  it('saves after a change to the saved fields', () => {
    const { store, localSave } = setup()
    store.getState().loadRoom(firstRoom, validMap)
    store.setState({ inventory: ['gold-key'] })
    expect(localSave()).toMatchObject({
      version: 1,
      currentRoomId: FIRST_ROOM_ID,
      enteredFrom: null,
      inventory: ['gold-key'],
      updatedAt: '2026-11-09T10:00:01.000Z',
    })
  })

  it('saves the room entered from after an exit, once the next room loads', () => {
    const { store, localSave } = setup()
    store.getState().loadRoom(firstRoom, validMap)
    store.getState().movePlayer('west')
    store.getState().takeExit()
    // Between rooms: nothing saved yet.
    expect(localSave()).toBeNull()
    store.getState().loadRoom(room2, validMap)
    expect(localSave()).toMatchObject({
      currentRoomId: 'room-2',
      enteredFrom: FIRST_ROOM_ID,
    })
  })

  it('does not save during a fight, and saves when it ends', () => {
    const { store, localSave } = setup()
    store.getState().loadRoom(firstRoom, validMap)
    store.setState({ combat: someFight })
    store.setState({ player: { ...PLAYER, currentHealth: 3 } })
    expect(localSave()).toBeNull()
    store.setState({ combat: null })
    expect(localSave()).toMatchObject({ health: 3 })
  })

  it('marks the game ended at game over, so the next load is a new game', () => {
    const { store, localSave } = setup({ localSave: saveAt(EARLY) })
    store.getState().loadRoom(room2, validMap)
    store.setState({ player: { ...PLAYER, currentHealth: 0 } })
    expect(localSave()).toEqual({
      version: 1,
      ended: true,
      updatedAt: '2026-11-09T10:00:01.000Z',
    })
    // More changes after it (the "You have fallen" line) don't save again.
    store.getState().movePlayer('north')
    expect(localSave().updatedAt).toBe('2026-11-09T10:00:01.000Z')
  })

  it('marks the game ended after the escape', () => {
    const { store, localSave } = setup({ localSave: saveAt(EARLY) })
    store.getState().loadRoom(room2, validMap)
    store.setState({ hasEscaped: true })
    expect(localSave()).toMatchObject({ ended: true })
  })

  it('saves settings on every change, with the time', () => {
    const { store, localSettings } = setup()
    store.getState().updateSettings({ highContrast: true })
    expect(localSettings()).toEqual({
      settings: { ...settings, highContrast: true },
      updatedAt: '2026-11-09T10:00:01.000Z',
    })
  })

  it('never calls Supabase for a guest', () => {
    const { store, fetchRemote, pushRemote } = setup()
    store.getState().loadRoom(firstRoom, validMap)
    store.setState({ inventory: ['gold-key'] })
    store.getState().updateSettings({ highContrast: true })
    store.getState().loadRoom(room2, validMap)
    expect(fetchRemote).not.toHaveBeenCalled()
    expect(pushRemote).not.toHaveBeenCalled()
  })
})

describe('sync when signed in', () => {
  it('restores a newer remote save, and writes it to localStorage', async () => {
    const remote = saveAt(LATE, { health: 9 })
    const { store, session, localSave } = setup({
      user: 'player-1',
      localSave: saveAt(EARLY),
      remoteSave: { data: remote, updatedAt: LATE },
    })
    await session.idle()
    expect(store.getState().player.currentHealth).toBe(9)
    expect(localSave()).toEqual(remote)
  })

  it('says so in the log when the remote save replaces a room on screen', async () => {
    const remote = saveAt(LATE)
    const { store, session } = setup({
      user: 'player-1',
      remoteSave: { data: remote, updatedAt: LATE },
    })
    // The first room loaded before the fetch came back.
    store.getState().loadRoom(firstRoom, validMap)
    await session.idle()
    expect(store.getState().currentRoomId).toBe('room-2')
    expect(store.getState().pendingExitLines.map((line) => line.text)).toEqual([
      'A newer save from your account has been loaded.',
    ])
  })

  it('pushes a newer local save instead', async () => {
    const local = saveAt(LATE)
    const { store, session, pushRemote } = setup({
      user: 'player-1',
      localSave: local,
      remoteSave: { data: saveAt(EARLY, { health: 1 }), updatedAt: EARLY },
    })
    await session.idle()
    expect(pushRemote).toHaveBeenCalledWith('save', local, LATE)
    expect(store.getState().player.currentHealth).toBe(6)
  })

  it('ignores an unusable remote save and pushes the local one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const local = saveAt(EARLY)
    const { session, pushRemote } = setup({
      user: 'player-1',
      localSave: local,
      remoteSave: { data: { version: 0 }, updatedAt: LATE },
    })
    await session.idle()
    expect(pushRemote).toHaveBeenCalledWith('save', local, EARLY)
    expect(warn).toHaveBeenCalled()
  })

  it('starts a new game when the game ended on another device later', async () => {
    const ended: EndedGame = { version: 1, ended: true, updatedAt: LATE }
    const { store, session, localSave } = setup({
      user: 'player-1',
      localSave: saveAt(EARLY),
      remoteSave: { data: ended, updatedAt: LATE },
    })
    store.getState().loadRoom(room2, validMap)
    await session.idle()
    expect(store.getState().currentRoomId).toBe(FIRST_ROOM_ID)
    expect(store.getState().player).toEqual(PLAYER)
    expect(store.getState().inventory).toEqual([])
    expect(localSave()).toEqual(ended)
  })

  it('applies newer remote settings without saving them again', async () => {
    const remoteSettings = { ...settings, logVerbosity: 'brief' as const }
    const { store, session, localSettings, pushRemote } = setup({
      user: 'player-1',
      localSettings: { settings, updatedAt: EARLY },
      remoteSettings: { data: remoteSettings, updatedAt: LATE },
    })
    await session.idle()
    expect(store.getState().settings).toEqual(remoteSettings)
    expect(localSettings()).toEqual({
      settings: remoteSettings,
      updatedAt: LATE,
    })
    expect(pushRemote).not.toHaveBeenCalled()
  })

  it('keeps default settings out of the way of the remote ones', async () => {
    // A new device has never saved settings, so the account's settings win,
    // even though they are older than "now".
    const remoteSettings = { ...settings, highContrast: true }
    const { store, session } = setup({
      user: 'player-1',
      remoteSettings: { data: remoteSettings, updatedAt: EARLY },
    })
    await session.idle()
    expect(store.getState().settings.highContrast).toBe(true)
  })

  it('syncs when the player signs in later, not before', async () => {
    const { session, fetchRemote, setUser } = setup()
    expect(fetchRemote).not.toHaveBeenCalled()
    setUser('player-1')
    await session.idle()
    expect(fetchRemote).toHaveBeenCalledTimes(2)
    // A token refresh calls back with the same player: no second sync.
    setUser('player-1')
    await session.idle()
    expect(fetchRemote).toHaveBeenCalledTimes(2)
  })

  it('keeps playing locally when the network fails, and tries again later', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { store, session, fetchRemote, pushRemote, localSave } = setup({
      user: 'player-1',
      fetchFails: true,
    })
    await session.idle()
    expect(warn).toHaveBeenCalled()
    store.getState().loadRoom(firstRoom, validMap)
    store.setState({ inventory: ['gold-key'] })
    // Saved locally as always, but nothing pushed without a sync.
    expect(localSave()).toMatchObject({ inventory: ['gold-key'] })
    expect(pushRemote).not.toHaveBeenCalled()
    // The next push moment (a room change) tries the sync again.
    store.getState().loadRoom(room2, validMap)
    await session.idle()
    expect(fetchRemote.mock.calls.length).toBeGreaterThan(2)
  })
})

describe('pushing after the sync', () => {
  async function syncedSession() {
    const s = setup({ user: 'player-1' })
    s.store.getState().loadRoom(firstRoom, validMap)
    await s.session.idle()
    s.pushRemote.mockClear()
    return s
  }

  it('does not push an ordinary save', async () => {
    const { store, pushRemote, localSave } = await syncedSession()
    store.setState({ inventory: ['gold-key'] })
    expect(localSave()).toMatchObject({ inventory: ['gold-key'] })
    expect(pushRemote).not.toHaveBeenCalled()
  })

  it('pushes the save when a room has loaded', async () => {
    const { store, pushedKinds, localSave } = await syncedSession()
    store.getState().movePlayer('west')
    store.getState().takeExit()
    store.getState().loadRoom(room2, validMap)
    expect(pushedKinds()).toEqual(['save'])
    expect(localSave().currentRoomId).toBe('room-2')
  })

  it('pushes the save when a fight ends', async () => {
    const { store, pushRemote } = await syncedSession()
    store.setState({ combat: someFight })
    store.setState({ player: { ...PLAYER, currentHealth: 2 } })
    expect(pushRemote).not.toHaveBeenCalled()
    store.setState({ combat: null })
    expect(pushRemote).toHaveBeenCalledWith(
      'save',
      expect.objectContaining({ health: 2 }),
      expect.any(String),
    )
  })

  it('pushes the ended game when the player falls in a fight', async () => {
    const { store, pushRemote } = await syncedSession()
    store.setState({ inventory: ['gold-key'] })
    store.setState({ combat: someFight })
    // Falling ends the fight in the same set().
    store.setState({ combat: null, player: { ...PLAYER, currentHealth: 0 } })
    expect(pushRemote).toHaveBeenCalledWith(
      'save',
      expect.objectContaining({ ended: true }),
      expect.any(String),
    )
  })

  it('pushes settings when they change', async () => {
    const { store, pushRemote } = await syncedSession()
    store.getState().updateSettings({ textSize: 'large' })
    expect(pushRemote).toHaveBeenCalledWith(
      'settings',
      { ...settings, textSize: 'large' },
      expect.any(String),
    )
  })

  it('stops pushing after signing out', async () => {
    const { store, pushRemote, setUser } = await syncedSession()
    setUser(null)
    store.getState().updateSettings({ textSize: 'large' })
    store.getState().loadRoom(room2, validMap)
    expect(pushRemote).not.toHaveBeenCalled()
  })
})
