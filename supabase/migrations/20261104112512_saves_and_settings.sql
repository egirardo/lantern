-- Saves and settings, one row per player each.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- See supabase/README.md for the steps and how to check the result.
--
-- Two layers protect each table, and BOTH are needed:
--   1. GRANT decides which roles may touch the table at all. In this project
--      "Automatically expose new tables" is off, so a new table has no grants
--      and supabase-js gets "permission denied" until we add them.
--   2. Row-level security (RLS) policies decide WHICH ROWS a role may see or
--      change. With RLS enabled and no policy, every row is hidden.
-- The `authenticated` role is what Supabase uses for a signed-in player.
-- The `anon` role is everyone else (the publishable key without a login).
-- anon gets nothing, so a guest's game never talks to these tables.

-- Run everything as one transaction: if any line fails, nothing is created,
-- so the file can be fixed and pasted again from the start.
begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per player. user_id is the primary key, so a second row for the
-- same player is impossible, and saving again replaces the row (an "upsert").
-- One row means one updated_at to compare, which is what "newest wins"
-- (CLAUDE.md, architecture rule 8) needs.
--
-- `references auth.users` links the row to the Supabase account.
-- `on delete cascade` deletes the save when the account is deleted, so no
-- orphan data is left behind.
--
-- updated_at has no `default now()` on purpose. It must be the time the save
-- was made on the player's device, the same clock as the localStorage copy.
-- If the server stamped it, a save made offline at 10:00 and synced at 12:00
-- would look newer than a save made on another device at 11:00, and the
-- wrong one would win. Without a default, a client that forgets to send it
-- gets an error instead of a silently wrong timestamp.
create table public.saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null
);

-- Same shape as saves. Kept as its own table so settings and progress sync
-- separately: changing text size shouldn't overwrite a newer save, or the
-- other way round.
create table public.settings (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- saves: grants and policies
-- ---------------------------------------------------------------------------

-- Turn RLS on. From now on a row is only visible or changeable if a policy
-- below allows it.
alter table public.saves enable row level security;

-- Layer 1: signed-in players may use these four commands on the table.
-- Which rows they reach is decided by the policies below.
grant select, insert, update, delete on public.saves to authenticated;

-- anon gets no grant. This revoke changes nothing today (there are no grants
-- to remove), but it makes the intent explicit and stays correct even if the
-- "expose new tables" setting is turned on later.
revoke all on public.saves from anon;

-- In every policy, auth.uid() is the id of the signed-in player, read from
-- their login token (JWT). Writing it as `(select auth.uid())` lets Postgres
-- run it once per query instead of once per row, which Supabase recommends.
-- The result is the same.
--
-- `using (...)` filters the rows that ALREADY EXIST: rows where it is false
--   are invisible to the command, as if they weren't there.
-- `with check (...)` tests the NEW version of a row before it is written: if
--   it is false, the whole command fails with an error.

-- A player can read only their own save.
create policy "Players can read their own save"
  on public.saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A player can only create a save that belongs to them. Insert has no
-- existing row to filter, so it only has `with check`.
create policy "Players can create their own save"
  on public.saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- A player can change only their own save (`using`), and can't change it into
-- someone else's by setting user_id to another id (`with check`).
create policy "Players can update their own save"
  on public.saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A player can delete only their own save. Delete writes no new row, so it
-- only has `using`.
create policy "Players can delete their own save"
  on public.saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- settings: grants and policies (the same as for saves)
-- ---------------------------------------------------------------------------

alter table public.settings enable row level security;

grant select, insert, update, delete on public.settings to authenticated;

revoke all on public.settings from anon;

-- A player can read only their own settings.
create policy "Players can read their own settings"
  on public.settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A player can only create settings that belong to them.
create policy "Players can create their own settings"
  on public.settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- A player can change only their own settings, and can't give them away.
create policy "Players can update their own settings"
  on public.settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A player can delete only their own settings.
create policy "Players can delete their own settings"
  on public.settings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

commit;
