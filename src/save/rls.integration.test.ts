// Integration tests for the row-level security (RLS) policies in
// supabase/migrations/. Unlike the other tests, these talk to the real
// Supabase project over the network, signed in as two real test users.
//
// They are skipped unless .env.local has the Supabase URL and key AND the
// logins of the two test users (see .env.example and supabase/README.md), so
// `npm run test` and CI pass without them.
//
// Player A uses the app's own code (signIn, pushRemote, fetchRemote) for the
// normal case. The attacks use supabase-js directly, because that's what an
// attacker would do: they would skip our code, so our code can't be what
// protects the data. Only the policies can.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { signIn, signOut } from './auth'
import type { Database } from './database-types'
import { fetchRemote, pushRemote } from './remote-store'
import { getSupabaseClient } from './supabase-client'

// The Postgres error code "insufficient_privilege". Supabase returns it both
// when a policy's `with check` rejects a row and when a role has no grant
// on the table ("permission denied").
const INSUFFICIENT_PRIVILEGE = '42501'

type Config = {
  url: string
  publishableKey: string
  userA: { email: string; password: string }
  userB: { email: string; password: string }
}

// Reads one env variable. import.meta.env values are untyped here, so check
// that it really is a non-empty string.
function readEnv(name: string): string | undefined {
  const value: unknown = import.meta.env[name]
  return typeof value === 'string' && value !== '' ? value : undefined
}

// All six variables, or null if any is missing.
function readConfig(): Config | null {
  const url = readEnv('VITE_SUPABASE_URL')
  const publishableKey = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
  const emailA = readEnv('TEST_USER_A_EMAIL')
  const passwordA = readEnv('TEST_USER_A_PASSWORD')
  const emailB = readEnv('TEST_USER_B_EMAIL')
  const passwordB = readEnv('TEST_USER_B_PASSWORD')
  if (
    !url ||
    !publishableKey ||
    !emailA ||
    !passwordA ||
    !emailB ||
    !passwordB
  ) {
    return null
  }
  return {
    url,
    publishableKey,
    userA: { email: emailA, password: passwordA },
    userB: { email: emailB, password: passwordB },
  }
}

const config = readConfig()

// A separate client with its own session, so B and the signed-out visitor
// don't share player A's login in the app's shared client.
// persistSession: false keeps the session in memory only.
function newClient(config: Config): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

describe.skipIf(config === null)(
  'row-level security',
  // Network calls are slower than the default 5 second test timeout allows.
  { timeout: 20_000 },
  () => {
    let asA: SupabaseClient<Database>
    let asB: SupabaseClient<Database>
    let asAnon: SupabaseClient<Database>
    let userAId: string
    let userBId: string

    beforeAll(async () => {
      // skipIf above means config is never null here, but TypeScript can't
      // see that inside the callback, so check again.
      if (!config) {
        throw new Error('Missing Supabase test configuration')
      }

      // Player A signs in through the app's own auth code and shared client.
      const userA = await signIn(config.userA.email, config.userA.password)
      userAId = userA.id
      asA = getSupabaseClient()

      asB = newClient(config)
      const { data, error } = await asB.auth.signInWithPassword(config.userB)
      if (error) {
        throw error
      }
      userBId = data.user.id

      // Never signed in: this client uses the `anon` role.
      asAnon = newClient(config)

      // If both logins were the same account, every "can't touch B's row"
      // test would test nothing.
      expect(userAId).not.toBe(userBId)
    })

    afterAll(async () => {
      // Clean up every row the tests made. Each player deletes their own,
      // which the delete policy allows.
      // The `?.` is because a failed sign-in in beforeAll leaves them unset.
      for (const table of ['saves', 'settings'] as const) {
        await asA?.from(table).delete().eq('user_id', userAId)
        await asB?.from(table).delete().eq('user_id', userBId)
      }
      await signOut()
      await asB?.auth.signOut({ scope: 'local' })
    })

    // Run the same tests for both tables.
    describe.each([
      { kind: 'save', table: 'saves' },
      { kind: 'settings', table: 'settings' },
    ] as const)('$table', ({ kind, table }) => {
      // Before every test, A and B each have a row we can recognise.
      beforeEach(async () => {
        await pushRemote(kind, { owner: 'a' }, new Date().toISOString())

        const { error } = await asB.from(table).upsert(
          {
            user_id: userBId,
            data: { owner: 'b' },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        if (error) {
          throw error
        }
      })

      // Reads B's row the way B sees it, to check that A changed nothing.
      async function readRowAsB() {
        const { data, error } = await asB
          .from(table)
          .select('data')
          .eq('user_id', userBId)
        if (error) {
          throw error
        }
        return data
      }

      it('lets a player write and read their own row', async () => {
        const updatedAt = new Date().toISOString()
        await pushRemote(kind, { owner: 'a', turn: 7 }, updatedAt)

        const record = await fetchRemote(kind)

        expect(record?.data).toEqual({ owner: 'a', turn: 7 })
        // Postgres may format the timestamp differently, so compare times.
        expect(Date.parse(record?.updatedAt ?? '')).toBe(Date.parse(updatedAt))
      })

      it("doesn't show another player's row", async () => {
        // Asking for B's row directly finds nothing. It isn't an error:
        // RLS makes the row invisible, as if it didn't exist.
        const byId = await asA.from(table).select().eq('user_id', userBId)
        expect(byId.error).toBeNull()
        expect(byId.data).toEqual([])

        // Asking for every row returns only A's own.
        const all = await asA.from(table).select('user_id')
        expect(all.error).toBeNull()
        expect(all.data).toEqual([{ user_id: userAId }])
      })

      it("can't update another player's row", async () => {
        // .select() returns the rows that were changed. None were, because
        // the update policy's `using` hides B's row from A.
        const { data, error } = await asA
          .from(table)
          .update({ data: { owner: 'hacked' } })
          .eq('user_id', userBId)
          .select()

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await readRowAsB()).toEqual([{ data: { owner: 'b' } }])
      })

      it("can't delete another player's row", async () => {
        const { data, error } = await asA
          .from(table)
          .delete()
          .eq('user_id', userBId)
          .select()

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await readRowAsB()).toEqual([{ data: { owner: 'b' } }])
      })

      it("can't overwrite another player's row with an upsert", async () => {
        // The insert policy's `with check` rejects a row with B's user_id,
        // so this is an error, not a silent "no rows".
        const { error } = await asA.from(table).upsert(
          {
            user_id: userBId,
            data: { owner: 'hacked' },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(await readRowAsB()).toEqual([{ data: { owner: 'b' } }])
      })

      it("can't create a row for another player", async () => {
        // B has no row, so nothing but the policy can stop the insert.
        await asB.from(table).delete().eq('user_id', userBId)

        const { error } = await asA.from(table).insert({
          user_id: userBId,
          data: { owner: 'hacked' },
          updated_at: new Date().toISOString(),
        })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(await readRowAsB()).toEqual([])
      })

      it("can't hand their own row over to another player", async () => {
        // A may update their own row (`using` passes), but the new version
        // would belong to B, so the update policy's `with check` rejects it.
        // B has no row, so a duplicate key can't be what stops it.
        await asB.from(table).delete().eq('user_id', userBId)

        const { error } = await asA
          .from(table)
          .update({ user_id: userBId })
          .eq('user_id', userAId)

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(await readRowAsB()).toEqual([])
        expect((await fetchRemote(kind))?.data).toEqual({ owner: 'a' })
      })

      it('lets a signed-out visitor read nothing', async () => {
        // anon has no grant on the table, so Postgres refuses before RLS is
        // even checked: "permission denied", and no rows.
        const { data, error } = await asAnon.from(table).select()

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(data ?? []).toEqual([])
      })

      it('lets a signed-out visitor write nothing', async () => {
        const inserted = await asAnon.from(table).insert({
          user_id: userAId,
          data: { owner: 'hacked' },
          updated_at: new Date().toISOString(),
        })
        const updated = await asAnon
          .from(table)
          .update({ data: { owner: 'hacked' } })
          .eq('user_id', userAId)
        const deleted = await asAnon.from(table).delete().eq('user_id', userAId)

        expect(inserted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(updated.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(deleted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        // A's row is still there and unchanged.
        expect((await fetchRemote(kind))?.data).toEqual({ owner: 'a' })
      })
    })
  },
)
