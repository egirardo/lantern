# Supabase

The database setup for saves and settings. We don't use the Supabase CLI, so the SQL in `migrations/` is applied by hand in the SQL editor. Each file is run once, in the order of the date in its name.

## Apply a migration

1. Open the project in the Supabase dashboard and go to **SQL Editor**.
2. Start a new query, paste the whole file (e.g. `migrations/20261104112512_saves_and_settings.sql`) and click **Run**.
3. It should say "Success. No rows returned". The file runs as one transaction, so if it fails, nothing was created: fix the problem and run the whole file again.
4. Check the result:
   - **Table Editor**: the tables `saves` and `settings` exist, each with `user_id`, `data` and `updated_at`.
   - **Authentication → Policies** (or the table's "RLS policies" view): both tables say RLS is **enabled**, and each has four policies (read, create, update, delete), all for the `authenticated` role.

Running the file a second time fails with "relation already exists". That's expected: it has already been applied.

## Create the two test users

The RLS tests sign in as two real users, to check that one can't reach the other's rows.

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter an email and a password, and tick **Auto Confirm User** (so no email is sent).
3. Do it twice, for user A and user B. Use test accounts only, not your own.

## Run the RLS tests

1. Add the two users' logins to `.env.local`, next to the Supabase URL and key. The variable names are in `.env.example`.
2. Run only the RLS tests:

   ```
   npx vitest run src/save/rls.integration.test.ts
   ```

3. Passing looks like `Tests 18 passed (18)`: 9 tests for `saves` and the same 9 for `settings`.

If any of the six variables is missing, the tests show as **skipped** instead. That's also what happens in `npm run test` and in CI, which don't have the logins.

The tests delete the rows they create when they finish. If a run is stopped halfway, a row may be left behind. It's harmless, and the next run overwrites it.
