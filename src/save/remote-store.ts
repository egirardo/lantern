import { getCurrentUser } from './auth'
import type { Json } from './database-types'
import { getSupabaseClient } from './supabase-client'

// Reads and writes the signed-in player's save or settings in Supabase.
//
// This layer is deliberately thin: it moves JSON in and out of the database
// and nothing else. Checking the shape of the data (Zod) and deciding which
// copy is newest belong to the save code that calls it.
//
// Like auth.ts, every function throws on an error instead of returning it.

export type RemoteKind = 'save' | 'settings'

// What is stored for one player: the JSON itself and when it was made.
export type RemoteRecord = {
  data: Json
  // An ISO timestamp from the database, e.g. "2026-11-04T10:00:00+00:00".
  // Postgres may format it differently from Date.toISOString(), so compare
  // timestamps with Date.parse(), never as strings.
  updatedAt: string
}

// Which table each kind lives in. `as const` keeps the exact names, so
// supabase-js can check them against the Database type.
const tableFor = {
  save: 'saves',
  settings: 'settings',
} as const

// Returns the player's stored record, or null if they have none yet.
export async function fetchRemote(
  kind: RemoteKind,
): Promise<RemoteRecord | null> {
  const userId = await requireUserId()

  // Row-level security would already hide other players' rows, but asking
  // for our own row by id says what we mean, and doesn't rely on the policy
  // for the code to be correct.
  // maybeSingle() returns the one row, or null when there is none (single()
  // would treat "no row" as an error).
  const { data, error } = await getSupabaseClient()
    .from(tableFor[kind])
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }
  if (!data) {
    return null
  }
  return { data: data.data, updatedAt: data.updated_at }
}

// Saves the player's record, replacing the one that's there.
// `updatedAt` is when the data was made on this device (see the SQL file for
// why the client sets it).
export async function pushRemote(
  kind: RemoteKind,
  data: Json,
  updatedAt: string,
): Promise<void> {
  const userId = await requireUserId()

  // An upsert inserts the row, or updates it if a row with the same user_id
  // already exists (`onConflict` names the column to match on). One call
  // covers both the first save and every later one.
  const { error } = await getSupabaseClient()
    .from(tableFor[kind])
    .upsert(
      { user_id: userId, data, updated_at: updatedAt },
      { onConflict: 'user_id' },
    )

  if (error) {
    throw error
  }
}

// The save code should only call this layer when someone is signed in, so a
// guest reaching it is a bug, and the error says so.
async function requireUserId(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not signed in: remote saves need a signed-in player')
  }
  return user.id
}
