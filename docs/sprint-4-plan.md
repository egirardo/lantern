# Sprint 4 plan: Finish the reference room, agents start, accounts (Nov 2–8)

**Goal:** the reference room is finished (keyboard combat, lantern, exits), the agent spec is written and the agents have started building the next two rooms.

Re-planned on **Mon Nov 2**, after Phase I was merged (PR #27). Sprint 3 ran over: Phases J, K and L were not started. This plan covers the whole way to submission, because Sprint 4 and Sprint 5 can no longer be planned separately. Submission is **before Nov 16**.

**Days available:** Mon afternoon, Tue, Wed (supervision), Thu (**a few hours in the morning only**), Fri, **Sun Nov 8** (a full day I chose to add), then Mon–Fri Nov 9–13. About **10 working days**. Sat Nov 7 is free. Sat–Sun Nov 14–15 is a buffer, not planned work.

**Estimated work left (Musts only):** about 10.5–13 days. It doesn't fit without the decisions below.

---

## Decisions (Nov 2)

1. **The dungeon has 3 rooms:** my reference room plus 2 rooms built by agents. This is plan B from the risks section in `docs/project-plan.md`, and still meets the "3–5 rooms" Must.
2. **Supervision Nov 4:** demo a whole fight played with the keyboard (after Phase J) and show this re-plan. Not "the full dungeon and account sync" as the project plan says.
3. **Playwright and axe-core: minimum.** One axe-core scan of the game page, plus one keyboard Playwright path if there's time on Thu Nov 12. The rest is future work in the report.
4. **All Shoulds move to after submission** (Sprint 6): inventory, colorblind design and game speed, sound cues, moving a guest save to an account, magic links. They go in the report as "future improvements" if they aren't done.
5. **Work split for Phases J, K and L:** for pure helpers in `src/game/` (e.g. reveal narration, verbosity), I write the tests and Claude Code writes the implementation, the same as for the combat helpers on Nov 2. I write the React components, focus handling, Phaser code and store wiring myself. Logged in `docs/ai-log.md`, and recorded in "Plan changes" so the evaluation is honest about what was AI-written.

**What gives first if a day slips:** the weekend buffer (Nov 14–15), then the Playwright path, then the room count stays at 3 even if an agent room needs a lot of fixing (fix it rather than build a fourth).

---

## Timeline

| Day | Work |
| --- | --- |
| Mon Nov 2, afternoon | Re-plan (this file). Tick Phase I. Update the status in `CLAUDE.md`. Read through Phase J |
| Tue Nov 3 | **Phase J:** action menu, focus, choosing a target, "It's your turn" |
| Wed Nov 4 | **Supervision:** demo keyboard combat and the re-plan. Then start **Phase K** |
| Thu Nov 5 (morning) | Finish **Phase K:** lantern light and narration of what it reveals |
| Fri Nov 6 | **Exits and room changes** |
| Sun Nov 8 | **Agent spec** ("Building rooms" in `CLAUDE.md`), start the agents on rooms 2 and 3. Start **Phase L** |
| Mon Nov 9 | Finish **Phase L:** settings |
| Tue Nov 10 | **Guest saves** (localStorage), then **Supabase sign-in** with accessible login and sign-up |
| Wed Nov 11 | **Sync** saves and settings to the account, **row-level security** and its tests. Review the agent rooms |
| Thu Nov 12 | **Full screen reader pass** (VoiceOver), one axe scan, fixes. Finish reviewing the agent rooms |
| Fri Nov 13 | **WCAG 2.2 evaluation**, agent-workflow evaluation, README, AI log summary, Result section. **Submit** |
| Sat–Sun Nov 14–15 | Buffer |

The riskiest days are **Tue Nov 10 and Wed Nov 11** (Supabase is new to me). If anything slips, the buffer goes there, not to new work.

---

## Phase J: keyboard action menus and focus (Tue Nov 3)

As written in `docs/sprint-3-plan.md`, Phase J. What exists now: the store has `combat`, `player`, `enemies` and `playerAttack(targetId)`. When the player wins initiative, `combat` is set and it's the player's turn. When enemies go first, their attacks are already in the log.

- [ ] Action menu with real `<button>`s, shown while `combat` isn't null
- [ ] Focus moves into the menu when a fight starts, and back to the game region when it ends
- [ ] Choosing a target by name when more than one enemy is adjacent
- [ ] "It's your turn" in the log before focus lands in the menu
- [ ] Arrow keys don't move the player while the menu has focus
- [ ] A short VoiceOver check of one fight (the full pass is on Nov 12)
- [ ] PR reviewed

## Phase K: lantern rendering and narration (Wed Nov 4 – Thu Nov 5 morning)

As written in `docs/sprint-3-plan.md`, Phase K. Enemies are drawn for the first time here, only inside the light.

- [ ] Tiles outside the light drawn dark, redrawn on every move
- [ ] Enemies drawn only inside the light (looked up through the asset manifest)
- [ ] Narration when something new enters the light, once, with a direction (pure helper: I write the tests)
- [ ] PR reviewed

## Exits and room changes (Fri Nov 6)

The room format already has exits (doors and ladders on blocked tiles with a walkable neighbour). What's missing is using them.

1. **Going through an exit.** The player stands next to an exit and uses it (a key, plus a button for the action menu style). This loads the room in the exit's `to`.
2. **Arrive at the doorway, not `playerStart`** (decided Nov 2). In the new room, find the exit that leads back to the old room and place the player on its walkable neighbour. `playerStart` is only for the first room of a new game. Pure helper with tests.
3. **No leaving in a fight.** Moving is already blocked during combat. Using an exit must be blocked too, with a log line.
4. **Redrawing.** Destroy the old tilemap and player sprite before drawing the new room (two Open reminders in the learning notes).
5. **Narration.** Entering a room logs its description, as `loadRoom` already does.
6. **Tests** use small fixture rooms in the test files. No real second room yet: those are built by the agents.

- [ ] Exits work, tested with fixture rooms, PR reviewed

## Agent spec and agent rooms (Sun Nov 8 onwards)

1. **Write "Building rooms (for agents)" in `CLAUDE.md`:** the room data format, the Tiled map rules, enemy and exit rules, narration tone, and the checklist every agent room must pass (schema, tests, keyboard, screen reader, axe).
2. **Decide the two rooms** (names, how they connect to the entrance hall, which enemies) and give each agent the same kind of prompt.
3. **Each room arrives as a PR.** I review it, fix what's needed and log every correction in the evaluation table in `docs/ai-log.md`.

- [ ] Spec written
- [ ] Room 2 merged, corrections logged
- [ ] Room 3 merged, corrections logged

## Phase L: accessibility settings (Sun Nov 8 – Mon Nov 9)

As written in `docs/sprint-3-plan.md`, Phase L. Settings are saved with the save layer on Tue Nov 10.

- [ ] Settings in the store, with the `prefers-reduced-motion` default (tests)
- [ ] Settings dialog with focus management
- [ ] Text size, high contrast, reduced motion and log verbosity applied (verbosity is a pure helper: I write the tests)
- [ ] PR reviewed

## Saves, accounts and sync (Tue Nov 10 – Wed Nov 11)

Rule 8: local-first. Saves and settings always go to localStorage; when logged in they also go to Supabase, and the most recently updated version wins. Guest and logged-in mode use the same code path.

- [ ] Guest saves and settings in localStorage
- [ ] Supabase sign-in: accessible login and sign-up (pasting and password managers work, no puzzles)
- [ ] Sync to the account, newest version wins
- [ ] Row-level security policies, and tests that one user can't read another's data
- [ ] PR reviewed

## Testing and submission (Thu Nov 12 – Fri Nov 13)

- [ ] Full VoiceOver pass of all three rooms, with fixes
- [ ] One axe-core scan of the game page, with no serious or critical violations
- [ ] (If there's time) one keyboard Playwright path
- [ ] Written WCAG 2.2 evaluation
- [ ] Evaluation of the agent workflow (reference room vs agent rooms)
- [ ] README: setup, tech stack, asset credits and licenses
- [ ] AI log summary and the Result section in `docs/project-plan.md`
- [ ] Deployed, and the repo and deploy link submitted
