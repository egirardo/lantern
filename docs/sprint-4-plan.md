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
6. **UI skin with the Pixel RPG UI Pack, built by an agent (added Nov 3).** I slice the pieces I need from the sheet myself and choose an accessible font; an agent writes the CSS. It's a third agent task for the evaluation, next to rooms 2 and 3. **License:** the pack's custom license allows editing and commercial use but doesn't mention redistribution. I asked the author and have had no reply. I accept the risk of committing the pieces I use to the public repo, and mitigate it (see "UI skin"). This deviates from the project plan's "CC0 asset pack", so it goes in "Plan changes" and in the report.

**What gives first if a day slips:** the weekend buffer (Nov 14–15), then the UI skin (the game works without it, so it's the first thing to cut), then the Playwright path, then the room count stays at 3 even if an agent room needs a lot of fixing (fix it rather than build a fourth).

---

## Timeline

| Day | Work |
| --- | --- |
| Mon Nov 2, afternoon | Re-plan (this file). Tick Phase I. Update the status in `CLAUDE.md`. Read through Phase J |
| Tue Nov 3 | **Phase J:** action menu, focus, choosing a target, "It's your turn" |
| Wed Nov 4 | **Supervision:** demo keyboard combat and the re-plan. Then start **Phase K** |
| Thu Nov 5 (morning) | Finish **Phase K:** lantern light and narration of what it reveals |
| Fri Nov 6 | **Exits and room changes** |
| Sun Nov 8 | **Slice the UI pieces** from the sheet in Aseprite and choose the font (morning, about 1–1.5 h). **Agent spec** ("Building rooms" in `CLAUDE.md`) and the **UI skin brief**, start the agents on rooms 2 and 3. Start **Phase L** |
| Mon Nov 9 | Finish **Phase L:** settings. When the Phase L PR is merged, **start the UI skin agent** |
| Tue Nov 10 | **Guest saves** (localStorage), then **Supabase sign-in** with accessible login and sign-up |
| Wed Nov 11 | **Sync** saves and settings to the account, **row-level security** and its tests. Review the agent rooms and the **UI skin PR** |
| Thu Nov 12 | **Full screen reader pass** (VoiceOver), one axe scan, fixes. Finish reviewing the agent rooms |
| Fri Nov 13 | **WCAG 2.2 evaluation**, agent-workflow evaluation, README, AI log summary, Result section. **Submit** |
| Sat–Sun Nov 14–15 | Buffer |

The riskiest days are **Tue Nov 10 and Wed Nov 11** (Supabase is new to me). If anything slips, the buffer goes there, not to new work.

---

## Phase J: keyboard action menus and focus (Tue Nov 3)

Background in `docs/sprint-3-plan.md`, Phase J. Planned in detail on Nov 2.

**What exists now:** the store has `combat`, `player`, `enemies` and `playerAttack(targetId)`. Enemy turns run straight away inside `movePlayer` and `playerAttack`, so **whenever `combat` isn't null, it's the player's turn**. The menu is shown exactly then, with no turn check. The arrow-key handler is on the game region's `<div>`, so a menu placed outside that div can't trigger movement.

**Gap found:** `AdventureLog` puts every entry in `role="log"` (polite) and ignores `urgency`, so the low-health warning isn't announced assertively yet. Fixed in step 5.

**Decisions (Nov 2)**

1. **One button per living enemy** ("Attack the skeleton", "Attack the orc"), not "Attack" followed by a target list. One step, no submenu, and it still covers choosing a target.
2. **Tab, Enter and Space only.** Plain buttons do this natively. Arrow keys inside the menu would need the ARIA menu pattern (roving tabindex). Semantic HTML first; arrow keys only if the VoiceOver test shows they're missed.
3. **No Flee button, not even a disabled one.** Fleeing isn't a Must.
4. **No enemy health in the button text.** The canvas doesn't show it either; damage is already in the log.
5. **"It's your turn." is the last line of a step,** after the low-health warning (this changes "low health goes last"). The low-health line gets its own assertive region, so in the log the line right before the menu is the cue to act.

**Steps** (pure helpers: I write the tests, Claude implements. The rest I write myself.)

1. **"It's your turn." and healing in `finishStep`** (`combat-flow.ts`). Pure helpers.
   - A polite "It's your turn." at the end of every step where the fight goes on.
   - **Healing (decided Nov 2):** after a won fight, the player recovers **4 health**, up to their maximum, with a polite line: "You catch your breath and recover 4 health. You have 11 out of 12." Fixed, not rolled, so it's predictable for the player and the tests. **Changed Nov 3:** going through an exit into a new room also restores full health (see Exits, step 5). Healing back above the threshold re-arms the low-health warning with no extra code (`crossedLowHealth` compares before and after).
   - [x] Tests written, implemented
2. **`getAttackOptions(combat)`** in `src/game/`: `{ id, label }` for each living enemy, e.g. `{ id: 'e1', label: 'Attack the skeleton' }`, using the "the skeleton" wording from `narration.ts`. Pure helper, so the button text is unit-tested.
   - [ ] Tests written, implemented
3. **`CombatMenu.tsx`:** a section with a "Your turn" heading and a list of `<button>`s, one per option, each calling `playerAttack(option.id)`. Rendered in `App.tsx` between the game and the log, only while `combat !== null`.
   - [ ] Done
4. **Focus in and out:** one `useEffect` in `CombatMenu`. When the menu appears, save `document.activeElement` and focus the first button. In the effect's cleanup (when the menu disappears), focus the saved element again. After every attack, focus the first remaining button, because the focused one disappears when its enemy dies.
   - [ ] Done
5. **Assertive announcements:** a visually hidden `aria-live="assertive"` region in `AdventureLog` that holds only the newest assertive line, and a `.visually-hidden` CSS class.
   - [ ] Done
6. **Game over:** when the player falls, show "You have fallen. Reload the page to try again." and move focus to it (the same pattern as the error in `RoomLoader`: `tabIndex={-1}` and `.focus()`). A real "try again" comes with the save layer.
   - [ ] Done
7. **VoiceOver check** of a fight with one enemy and with two (the full pass is on Nov 12).
   - [ ] Done, PR reviewed

**Risks**

- **Focus versus the live region:** when focus jumps to the first button, VoiceOver may cut off polite log lines that arrived at the same moment (e.g. the initiative rolls). The "Your turn" heading helps. If lines get lost, choose the fix after hearing it in step 7.
- **A disappearing button:** killing one of two enemies removes the focused button, and focus drops to the top of the page (handled in step 4).
- **The low-health line may be read twice** (assertive region and log). Decide after hearing it in VoiceOver.

**Estimate:** steps 1–2 about 1 hour, steps 3–4 about 2.5 hours, steps 5–6 about 1.25 hours, step 7 about 1 hour.

## Phase K: lantern rendering and narration (Wed Nov 4 – Thu Nov 5 morning)

Background in `docs/sprint-3-plan.md`, Phase K. Enemies are drawn for the first time here, only inside the light. **Decor names added on Nov 2**, so Phase K will probably spill into **Fri morning**. If it slips further, use Sun morning before the agent spec, not next week. Decor names must be in before the agent spec, or the agents copy a format without them.

**Why decor names:** decor already *draws* with no code. `drawRoom` draws every tile layer, so walk-over decor (rugs, bones) can go on a new layer, and blocking decor (barrels, tables) goes on `walls`. But the text doesn't match: walking into a barrel says "A wall blocks your path.", and the lantern can't say "a barrel" (rule 5).

**Decisions (Nov 2)**

1. **Names come from a names table,** not from Tiled tile properties (this changes the Oct 20 idea). One Zod-validated JSON file next to the asset manifest maps tile ids to names, e.g. `{ "dungeon": { "1099": "barrel" } }`. Every room, including the agent rooms, shares it automatically, and map loading doesn't change. Tile properties would need the tileset exported from `entrance-hall.tmj` as a shared file and a third file fetched per room (about 3–4 hours instead of 1–1.5). Downside: names aren't visible while painting in Tiled.
2. **Doors don't need the table.** The room file's `exits` already lists the door tiles, so "A door appears to the north" comes from `room.exits`.
3. **Names live next to the grid, not in it.** The grid stays `'floor' | 'wall'`. Changing it would touch movement, visibility and all their tests.

**Steps** (pure helpers: I write the tests, Claude implements. Tiled work, Phaser and the store I do myself.)

1. **Names table and lookup:** `tile-names.json` plus a schema, and a lookup from a map gid to a name. Gotcha: Tiled shows the tile's *local* id (gid minus `firstgid`), and flipped tiles have flag bits set (`gid & 0x1fffffff`, as in `toTileIndices`). The table uses the id Tiled shows. Pure helper.
   - [ ] Tests written, implemented
2. **`buildFeatures(map)`:** `{ position, name }` for every named tile on any layer, built in `loadRoom` next to the grid and kept in the store. Pure helper.
   - [ ] Tests written, implemented, wired into the store
3. **Blocked-move text:** walking into a named tile says "A barrel blocks your path." An unnamed blocked tile still says wall. Pure helper (narration).
   - [ ] Tests written, implemented
4. **Name the decor (Tiled):** add the barrels, tables and so on to the entrance hall, and their tile ids to the table.
   - [ ] Done
5. **Render the dark (Phaser):** tiles outside `getVisibleTiles` drawn dark, redrawn on every move.
   - [ ] Done
6. **Enemies in the light (Phaser):** enemies drawn only inside the light, looked up through the asset manifest.
   - [ ] Done
7. **Reveal narration:** when an enemy, an exit or a named feature enters the light, log it once with a direction ("A barrel appears to the east."). A feature covering several tiles (the two-tile door) is announced once. Pure helper.
   - [ ] Tests written, implemented, wired into the store
8. - [ ] PR reviewed

**Rough order:** Wed afternoon steps 1–3. Thu morning step 7. Fri morning steps 4–6 and the PR. Fri afternoon exits.

## Exits and room changes (Fri Nov 6)

The room format already has exits (doors and ladders on blocked tiles with a walkable neighbour). What's missing is using them.

1. **Going through an exit.** The player stands next to an exit and uses it (a key, plus a button for the action menu style). This loads the room in the exit's `to`.
2. **Arrive at the doorway, not `playerStart`** (decided Nov 2). In the new room, find the exit that leads back to the old room and place the player on its walkable neighbour. `playerStart` is only for the first room of a new game. Pure helper with tests.
3. **No leaving in a fight.** Moving is already blocked during combat. Using an exit must be blocked too, with a log line.
4. **Redrawing.** Destroy the old tilemap and player sprite before drawing the new room (two Open reminders in the learning notes).
5. **Narration and full health.** Entering a room logs its description, as `loadRoom` already does. **Decided Nov 3:** going through an exit also restores the player to full health, with a polite line, because there are no potions and a hard earlier room shouldn't decide a harder later fight. The healing goes in the exit step, not in `loadRoom`, so loading a save later won't heal (the store test that `loadRoom` keeps health stays). Pure helper with tests.
6. **Tests** use small fixture rooms in the test files. No real second room yet: those are built by the agents.
7. **The goal: find the way out (decided Nov 2).** The last room has an exit marked `final` (e.g. a ladder up to the surface). Using it wins the game: a victory line in the log, and focus moves to a victory message (same pattern as game over in Phase J). Until now the game could only be lost. About 30 extra minutes.
8. **"How to play"** as a native `<details>` element above the map, with the rules text below. It opens and closes with the keyboard, and screen readers support it without ARIA. Fill in the door key once it's chosen. About 30 minutes.

- [ ] Exits work, tested with fixture rooms
- [ ] Final exit and victory
- [ ] "How to play" in the game
- [ ] PR reviewed

**Rules text (draft, Nov 2)**

```markdown
## How to play

**Your goal:** find the way out of the dungeon. The exit is somewhere in the last room.

**Moving.** Focus the dungeon map and use the arrow keys. Each key press is one step. Walls, objects and enemies block your way, and the adventure log tells you what happened.

**Your lantern.** You can only see three tiles around you. When something comes into the light, the log tells you what it is and in which direction.

**Fights.** A fight starts when you step next to an enemy. Everyone rolls a 20-sided die for initiative, and the highest roll goes first. You win a tie. On your turn, choose an enemy to attack in the action menu (Tab to move, Enter to choose). You can't move or run away during a fight.

**Attacks.** An attack is a 20-sided die plus your attack bonus. It hits if the total is at least the target's armor class. A natural 20 always hits and is a critical hit: the damage is rolled twice. A natural 1 always misses. Every roll is written in the log.

**Health.** You have 12 health. After you win a fight, you recover 4 health. When you go through a door into a new room, you recover fully. The game warns you when you're down to 3 or less. At 0 you fall, and the game is over.

**Doors.** [key to be decided] Use a door when you're next to it. You can't leave a room during a fight.

**No hurry.** The game always waits for you. There are no time limits.
```

**Check on Thu Nov 12:** play the whole dungeon once to see whether 12 health, healing 4 per won fight and full health per room are balanced. Adjust the numbers (data, not code) if it's too hard or too easy.

## Agent spec and agent rooms (Sun Nov 8 onwards)

1. **Write "Building rooms (for agents)" in `CLAUDE.md`:** the room data format, the Tiled map rules, enemy and exit rules, narration tone, and the checklist every agent room must pass (schema, tests, keyboard, screen reader, axe).
2. **Decide the two rooms** (names, how they connect to the entrance hall, which enemies) and give each agent the same kind of prompt.
3. **Each room arrives as a PR.** I review it, fix what's needed and log every correction in the evaluation table in `docs/ai-log.md`.

- [ ] Spec written
- [ ] Room 2 merged, corrections logged
- [ ] Room 3 merged, corrections logged

## UI skin (agent): Pixel RPG UI Pack (Sun Nov 8 – Wed Nov 11)

Decided Nov 3 (decision 6). The pack (immunitys, itch.io) has only one packed sheet, `Ui.png` (plus `Ui.aseprite` and `Ui.psd`), with no data saying where each piece is. An agent reading pixel coordinates by eye would get seams in the frames, so **I cut the pieces out myself** and the agent only writes CSS.

**Why the agent starts after Phase L:** by then the combat menu, game over, the log and the settings dialog all exist, so it styles real markup. The high contrast setting exists too, so the agent can make it turn the skin off instead of guessing how it will work.

1. **Slice the pieces (me, Sun Nov 8 morning, about 1–1.5 h).** Open `Ui.aseprite` and check for slices first. Export each piece I need as its own PNG: a panel frame, a button, a pressed or focused button, and maybe a heading banner. Only the pieces I use go into the repo, in their own folder with a credit file.
2. **Choose the font (me, same morning).** Readable at small sizes, with its license (e.g. SIL OFL), and all the characters the log uses (`+`, `=`, `'`, `!`).
3. **Write the brief (with Claude Code, Sun Nov 8, about 30 min).** Which piece goes on which element. Only CSS and class names change, never component structure or text. It shares the checklist with the room spec.
4. **The agent builds it as a PR (from Mon Nov 9).**
5. **I review it (Wed Nov 11, about 1–2 h with fixes)** and log every correction in the evaluation, the same as for the agent rooms.

**Accessibility rules for the skin** (from Oct 14):

- Frames are decoration around real HTML text. No text in images (WCAG 1.4.5 Images of Text).
- Text contrast against the frame colours meets AA (checked with axe).
- Focus stays clearly visible on styled buttons (a `border-image` can hide the outline).
- The high contrast setting turns the skin off or overrides it.
- `image-rendering: pixelated` and whole-number scaling, so the art stays sharp. Text size changes must not break the frames.

**License safeguards:** commit only the pieces I use, credit the author in the README with a link, note that I asked for permission on the itch.io page and haven't had a reply (keep a screenshot of the comments), and write it in the report as a known risk. The skin is one stylesheet and one folder, so it can be removed quickly if the author says no.

- [ ] Pieces sliced and exported, font chosen
- [ ] Brief written
- [ ] UI skin PR reviewed and merged, corrections logged

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
