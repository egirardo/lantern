import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase-client'

// Small wrappers around Supabase Auth (email + password only).
//
// Errors: every function THROWS when Supabase reports an error, instead of
// returning it. supabase-js itself returns `{ data, error }`, and it's easy to
// forget the `if (error)` check and carry on with empty data. A thrown error
// can't be ignored by accident, and it's the same style as
// src/rooms/fetch-room-files.ts. The thrown value is Supabase's own AuthError
// (a subclass of Error), so the login form can read `error.message`, or
// `error.code` (e.g. 'invalid_credentials') to choose its own wording.

export type SignUpResult = {
  user: User
  // false when the project requires the player to confirm their email first.
  // Then there is no session yet, and the form should say "check your email".
  signedIn: boolean
}

export async function signUp(
  email: string,
  password: string,
): Promise<SignUpResult> {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
  })
  if (error) {
    throw error
  }
  // Without an error Supabase always returns a user, but the type allows
  // null, so check instead of using `!`.
  if (!data.user) {
    throw new Error('Sign-up returned no user')
  }
  return { user: data.user, signedIn: data.session !== null }
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    throw error
  }
  return data.user
}

export async function signOut(): Promise<void> {
  // scope 'local' signs out this browser only. The default ('global') would
  // also sign the player out on their other devices, which would be a
  // surprise when they just close the game on one of them.
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' })
  if (error) {
    throw error
  }
}

// Returns the signed-in player, or null for a guest.
//
// This uses getSession(), which reads the session saved in localStorage, and
// not getUser(), which asks the Supabase server every time. getSession works
// offline and is instant, which suits local-first saves (rule 8).
// Is it safe to trust a local session? Here, yes: the browser only uses it to
// decide whether to try syncing. The real check happens on the server, where
// row-level security reads the signed login token on every request. A faked
// or expired session can't read or write anyone's rows.
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await getSupabaseClient().auth.getSession()
  if (error) {
    throw error
  }
  return data.session?.user ?? null
}

// Calls `callback` with the signed-in player (or null) every time the login
// state changes: sign in, sign out, token refresh, and once right away with
// the current state. Returns a function that stops listening, for a React
// effect's cleanup.
//
// Keep the callback synchronous. supabase-js warns that an async callback
// can deadlock if it calls back into Supabase Auth. If you need to fetch
// something when the player signs in, start it with setTimeout or from a
// React effect instead of awaiting it inside the callback.
export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null)
    },
  )
  return () => data.subscription.unsubscribe()
}
