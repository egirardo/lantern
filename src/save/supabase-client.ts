import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database-types'

// The one Supabase client the whole app shares.
//
// A Supabase client holds the login session (it saves it in localStorage and
// refreshes the token in the background). Two clients would each have their
// own idea of who is signed in, so everything must use this one.

let client: SupabaseClient<Database> | undefined

// Returns the shared client, creating it the first time it's needed.
//
// Why a function and not `export const supabase = createClient(...)`: a
// constant would run when the file is first imported. If the env variables
// were missing (a fresh clone, a preview deploy without them), importing any
// save code would crash the whole game, even for a guest who never signs in.
// Saves are local-first (rule 8), so the game must work without Supabase.
// With a function, the error only appears when something actually tries to
// reach Supabase.
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client
  }

  // Vite puts variables that start with VITE_ from .env.local into
  // import.meta.env. They are public: they end up in the browser bundle.
  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env.local (see .env.example).',
    )
  }

  // The publishable key only identifies the project. It's safe to ship,
  // because the row-level security policies decide what each player can do.
  client = createClient<Database>(url, publishableKey)
  return client
}
