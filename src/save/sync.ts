import type { StoreApi } from 'zustand/vanilla'
import { PLAYER } from '../game/player'
import { FIRST_ROOM_ID, type GameState } from '../state/game-store'
import { settingsSchema } from '../state/settings'
import { onAuthChange } from './auth'
import {
  readLocalSave,
  readLocalSettings,
  writeLocalSave,
  writeLocalSettings,
  type KeyValueStorage,
} from './local-store'
import { fetchRemote, pushRemote, type RemoteRecord } from './remote-store'
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
  type SaveContent,
} from './save-rules'
import {
  isSave,
  saveSlotSchema,
  type Save,
  type SaveSlot,
  type StoredSettings,
} from './save-schema'

// Saving and syncing (rule 8). Everything that touches the outside world
// meets here: the store, localStorage and Supabase. The decisions themselves
// (when to save, which copy wins) are the pure functions in save-rules.ts.
//
// The flow:
// 1. Start-up: read the local save and settings, check them, put them in
//    the store. This runs before React renders, so RoomLoader's first fetch
//    is already the saved room.
// 2. Every store change: save to localStorage when save-rules says so.
//    Guests and signed-in players take exactly this same path.
// 3. Signed in: fetch from Supabase once, and let the newest copy win on
//    both sides. After that, push at the moments shouldPush picks, when
//    settings change, and on pagehide.
// A network error is only a console.warn: the game always goes on locally.

// The lines logged when a sync replaces the game on screen (rule 5: the
// player jumps to another room or doorway, so the log must say why).
const NEWER_SAVE_LINE = 'A newer save from your account has been loaded.'
const ENDED_ELSEWHERE_LINE =
  'Your game on another device has ended, so a new game begins.'

// Everything sync needs from outside, passed in. The real ones are the
// default; the tests pass fakes, so no test needs a browser, localStorage or
// Supabase (dependency injection, the same idea as `random` in combat).
export type SaveDeps = {
  storage: KeyValueStorage
  fetchRemote: (kind: 'save' | 'settings') => Promise<RemoteRecord | null>
  pushRemote: typeof pushRemote
  // Calls back with the signed-in player's id, or null for a guest.
  onAuthChange: (callback: (userId: string | null) => void) => () => void
  now: () => Date
  // Runs a function a moment later. auth.ts says not to call Supabase from
  // inside the auth callback (it can deadlock), so the sync starts after it.
  later: (run: () => void) => void
}

export function browserDeps(): SaveDeps {
  return {
    // window.localStorage is read inside each call, not once here, because
    // just reading the property can throw when storage is blocked, and
    // local-store.ts catches errors around these calls.
    storage: {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
    },
    fetchRemote,
    pushRemote,
    onAuthChange: (callback) =>
      onAuthChange((user) => callback(user?.id ?? null)),
    now: () => new Date(),
    later: (run) => setTimeout(run, 0),
  }
}

export type SaveSession = {
  // Stops listening to the store, the auth state and pagehide.
  stop: () => void
  // Resolves when the sync in progress (if any) is done. For the tests.
  idle: () => Promise<void>
}

export function startSaving(
  store: StoreApi<GameState>,
  deps: SaveDeps = browserDeps(),
): SaveSession {
  // --- 1. Start-up: local first ---------------------------------------------

  // What localStorage holds right now. Kept in variables too, so every
  // comparison below doesn't have to read and parse localStorage again.
  let slot: SaveSlot | null = readLocalSave(deps.storage)
  let storedSettings: StoredSettings | null = readLocalSettings(deps.storage)

  // An ended game (or no save) means a new game: the store already is one.
  if (slot !== null && isSave(slot)) {
    store.getState().restoreSave(contentOf(slot), null)
  }
  if (storedSettings !== null) {
    store.getState().updateSettings(storedSettings.settings)
  }

  // The content of the last save written or loaded. A change in the store
  // is only saved when the content differs from this. That's also why a new
  // game isn't saved as soon as its first room loads: nothing has happened
  // yet, so there's no progress to lose, and an empty save with a new
  // updatedAt would win over the player's real save on Supabase.
  let lastContent: SaveContent = saveContent(store.getState())

  // --- 2. Save on every change ----------------------------------------------

  // Signed-in player's id, or null for a guest.
  let userId: string | null = null
  // True once this sign-in's first sync has finished. Until then nothing is
  // pushed: pushRemote overwrites the row without looking at it, so pushing
  // before comparing could replace a newer save from another device.
  let synced = false
  // The sync in progress, so two syncs never run at once.
  let syncing: Promise<void> | null = null

  // subscribe calls this after every set() with the new and the old state.
  const unsubscribe = store.subscribe((state, prev) => {
    // Settings: `!==` first, a cheap check that the object was replaced
    // (updateSettings always makes a new one); then the values, so loading
    // the same settings again isn't counted as a change.
    if (
      state.settings !== prev.settings &&
      (storedSettings === null ||
        !sameSettings(state.settings, storedSettings.settings))
    ) {
      storedSettings = {
        settings: state.settings,
        updatedAt: deps.now().toISOString(),
      }
      writeLocalSettings(deps.storage, storedSettings)
      pushSettings()
    }

    const action = saveAction(state)
    if (action === 'end' && (slot === null || isSave(slot))) {
      slot = buildEnded(deps.now())
      writeLocalSave(deps.storage, slot)
    } else if (action === 'save') {
      const content = saveContent(state)
      if (!sameContent(content, lastContent)) {
        slot = buildSave(state, deps.now())
        lastContent = content
        writeLocalSave(deps.storage, slot)
      }
    }

    if (shouldPush(prev, state)) {
      pushSave()
    }
  })

  // --- 3. Sync when signed in -------------------------------------------------

  function pushSave() {
    if (userId === null || slot === null) return
    if (!synced) {
      // The first sync failed (or hasn't finished): try it again instead.
      startSync()
      return
    }
    // `void` marks a promise we don't wait for on purpose; .catch makes
    // sure a failure is logged instead of becoming an unhandled rejection.
    void deps
      .pushRemote('save', slot, slot.updatedAt)
      .catch((error) => console.warn('Could not upload the save', error))
  }

  function pushSettings() {
    if (userId === null || storedSettings === null) return
    if (!synced) {
      startSync()
      return
    }
    void deps
      .pushRemote('settings', storedSettings.settings, storedSettings.updatedAt)
      .catch((error) => console.warn('Could not upload the settings', error))
  }

  function startSync() {
    if (syncing !== null || userId === null) return
    syncing = sync(userId).finally(() => {
      syncing = null
    })
  }

  async function sync(forUser: string) {
    try {
      // Both at once: Promise.all waits for both and fails if either fails.
      const [remoteSave, remoteSettings] = await Promise.all([
        deps.fetchRemote('save'),
        deps.fetchRemote('settings'),
      ])
      // The player signed out (or another one signed in) while we waited.
      if (userId !== forUser) return
      await syncSave(remoteSave)
      await syncSettings(remoteSettings)
      synced = true
    } catch (error) {
      // Not synced: the next push moment tries again. Until then, local only.
      console.warn('Could not sync with your account; saving locally', error)
    }
  }

  async function syncSave(record: RemoteRecord | null) {
    const remote = record === null ? null : checkRemoteSave(record)
    const winner = chooseNewest(
      slot?.updatedAt ?? null,
      remote?.updatedAt ?? null,
    )
    if (winner === 'local' && slot !== null) {
      await deps.pushRemote('save', slot, slot.updatedAt)
    } else if (winner === 'remote' && remote !== null) {
      // Remember what's on screen before replacing the slot.
      const hadGameInProgress = slot !== null && isSave(slot)
      slot = remote
      writeLocalSave(deps.storage, remote)
      applyRemoteSave(remote, hadGameInProgress)
    }
  }

  // Puts the winning remote save into the store, if it changes anything.
  function applyRemoteSave(remote: SaveSlot, hadGameInProgress: boolean) {
    // Only say something if there's a room on screen to replace.
    const roomOnScreen = store.getState().room !== null
    if (isSave(remote)) {
      const content = contentOf(remote)
      // The same progress as on screen: nothing to load again.
      if (sameContent(content, lastContent)) return
      lastContent = content
      store
        .getState()
        .restoreSave(content, roomOnScreen ? NEWER_SAVE_LINE : null)
    } else if (hadGameInProgress) {
      // The game ended on another device after the save on this one. A new
      // game, like a page load would give. If there was no game in progress
      // here, the store already is a new game, so nothing is replaced.
      lastContent = newGameContent(FIRST_ROOM_ID, PLAYER.maxHealth)
      store
        .getState()
        .restoreSave(lastContent, roomOnScreen ? ENDED_ELSEWHERE_LINE : null)
    }
  }

  async function syncSettings(record: RemoteRecord | null) {
    const remote = record === null ? null : checkRemoteSettings(record)
    const winner = chooseNewest(
      storedSettings?.updatedAt ?? null,
      remote?.updatedAt ?? null,
    )
    if (winner === 'local' && storedSettings !== null) {
      await deps.pushRemote(
        'settings',
        storedSettings.settings,
        storedSettings.updatedAt,
      )
    } else if (winner === 'remote' && remote !== null) {
      // Set before updateSettings, so the subscriber sees the same values
      // and doesn't save them again with a new updatedAt.
      storedSettings = remote
      writeLocalSettings(deps.storage, remote)
      store.getState().updateSettings(remote.settings)
    }
  }

  // The auth callback runs at once with the current state (start-up), and
  // again on every sign-in, sign-out and token refresh.
  let stopAuth = () => {}
  try {
    stopAuth = deps.onAuthChange((id) => {
      // A token refresh: the same player, nothing new to sync.
      if (id === userId) return
      userId = id
      synced = false
      if (id !== null) deps.later(startSync)
    })
  } catch (error) {
    // Supabase isn't configured (no .env.local): guests only, which is fine.
    console.warn('Accounts are unavailable; saving locally only', error)
  }

  // pagehide fires when the tab is closed, reloaded or put in the background
  // on a phone, the last moment to send the latest save. The browser may
  // stop the page before the request finishes; the local copy is safe
  // either way, and the next sync compares again.
  const onPageHide = () => {
    pushSave()
    pushSettings()
  }
  // No window in the Node tests.
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', onPageHide)
  }

  return {
    stop: () => {
      unsubscribe()
      stopAuth()
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', onPageHide)
      }
    },
    idle: () => syncing ?? Promise.resolve(),
  }
}

// Remote data is checked like local data: it might come from an older build.
// Unusable data counts as no data, so a valid local copy wins and replaces it.
function checkRemoteSave(record: RemoteRecord): SaveSlot | null {
  const result = saveSlotSchema.safeParse(record.data)
  if (!result.success) {
    console.warn('Ignoring the save from your account: unusable', result.error)
    return null
  }
  return result.data
}

function checkRemoteSettings(record: RemoteRecord): StoredSettings | null {
  const result = settingsSchema.safeParse(record.data)
  if (!result.success) {
    console.warn('Ignoring the settings from your account', result.error)
    return null
  }
  // In Supabase the time is its own column, not part of the data.
  return { settings: result.data, updatedAt: record.updatedAt }
}

// A save without its bookkeeping, for restoreSave and comparisons.
function contentOf(save: Save): SaveContent {
  return {
    currentRoomId: save.currentRoomId,
    enteredFrom: save.enteredFrom,
    health: save.health,
    inventory: save.inventory,
    takenItemIds: save.takenItemIds,
    defeatedEnemyIds: save.defeatedEnemyIds,
  }
}
