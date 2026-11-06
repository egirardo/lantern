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

7. **Code freeze Nov 16, and agents take more of the engine (added Nov 4).** I heard on Nov 4 that no code can be pushed after Nov 16, so the supervisors can review everything. The submission date doesn't change, but Sprint 6 (Nov 16–22) is gone as a safety net, and the plan was already tight. So agents now build the lower-risk engine work as well as the rooms. Each agent works in its own git worktree and delivers a PR that I review and play. I keep everything that is critical for accessibility. Logged in "Plan changes" in `docs/project-plan.md`, and the agent work is evaluated the same way as the agent rooms.

   | Work | Who |
   | --- | --- |
   | Phase J step 7 (VoiceOver check, PR) | Me |
   | Phase K steps 1–3 and 7 (names table, features, blocked-move text, reveal narration) | I write the tests, Claude Code implements (as before) |
   | Phase K step 4 (decor in Tiled) | Me |
   | **Phase K steps 5–6** (Phaser: the dark, enemies in the light) | **Agent A** |
   | **Supabase foundation** (SQL tables, RLS policies, RLS tests, auth client) | **Agent B** |
   | **Exits and room changes** (all steps, incl. final exit, victory, "How to play"; from decision 8 also the item format and the locked exit) | **Agent C** |
   | **Items and inventory** (picking up, inventory in the store, the inventory list), decision 8 | **Agent E** |
   | Phase L settings (store, dialog, focus, applying them) | Me. Claude Code implements the verbosity helper against my tests |
   | **Guest saves and sync** (localStorage, newest version wins) | **Agent D** |
   | Login and sign-up form | Me (WCAG 2.2 Accessible Authentication) |
   | Rooms 2 and 3 | Agents (as before). The UI skin is cut (decision 8) |
   | VoiceOver checks, screen reader pass, evaluations, report | Me |

   **Rules for the agents:** they follow the architecture rules in `CLAUDE.md`, write unit tests for new helpers in `src/game/`, and the PR must pass test, lint and typecheck. Agents don't write focus code, and don't change log wording without asking. Agents don't install anything: if a dependency is needed, they stop, and I run the install. Each PR description has a "How it works" walkthrough, so I can explain and defend the code. Agents that touch the same files (`game-store.ts`, `room-scene.ts`) run one after the other, not at the same time.

8. **The goal is a key, and the UI skin is cut (added Nov 4).** The player is locked in the dungeon and must find the way out. The final exit is **locked**, and the key for it lies in **a different room** from the exit. Because agents now take more of the work, I'm bringing back part of the inventory Should, in place of the UI skin. It's more useful for the thesis, because an inventory you can use with the keyboard is accessibility work, and the skin is cosmetic.
   - **In:** items in the room file (schema and tests), an exit that needs a key (`requires: "<item id>"`), picking up an item by stepping on it, the inventory in the store, and a simple inventory list in React (a heading and a `<ul>`, with no focus moves). Every step has a log line: "You pick up a rusty key." "The door is locked. You need a key." "You unlock the door with the rusty key."
   - **The key is used automatically** at the locked exit, so there's no new menu action and the combat menu doesn't change.
   - **First stretch item (decided Nov 4): health potions looted from barrels and crates.** Only built if the reviews are on schedule on Wed Nov 11, by a new Agent F. Otherwise it goes in the report as future work. Design in "Stretch: potions in containers" below. Until then, healing stays as decided (+4 after a won fight, full health per room).
   - **Cut:** the UI skin agent (decision 6). The game works without it, and it was already first in line to cut. The Pixel Operator font stays.
   - **Who:** Agent C adds the item format and the locked exit to its exits work, so both are merged before the room spec on Sun Nov 8. A new **Agent E** builds picking up, the inventory in the store and the list, after Agent C (both change the store). Agent D (saves) starts after E, so the inventory is in the save.
   - **Room spec:** the agents place the key in room 2 and the locked final exit in room 3.
   - **The key is guarded (added Nov 4).** In room 2, the key lies where the player can only reach it by passing next to an enemy (an alcove or a dead-end corridor), so getting out means winning that fight. It's only a rule in the room spec, not new code: a fight already starts when the player steps next to an enemy, and enemies block movement. The spec's checklist says: "every path to the key passes a tile next to an enemy". An enemy that carries the key and drops it when it's defeated would need new code, so it goes in the report as a future improvement.

9. **Supervision feedback (Nov 4, recorded Nov 5).** Two points from the supervisors:
   - **VoiceOver repeats the map's controls.** Every time focus goes back to the map (after a fight, for example), VoiceOver reads the whole label "Dungeon map. Use the arrow keys to move." again, plus its own hint for `role="application"`. The supervisors asked me to look into options. **Decided Nov 5:**
     - **With the start screen (option B, changed Nov 5):** the map's label becomes just "Dungeon map". The controls move to the "How to play" button on the start screen, so a player who needs them finds that button among the start screen's buttons. **Structure (Nov 5):** a heading with the game's title, then the buttons in a `<ul>`, with "How to play" right after Start. VoiceOver says "list, 3 items" when focus enters, so the player knows there's more to tab to. No `aria-describedby`: VoiceOver reads a description after a pause on every focus, so the controls would still repeat. Until the start screen exists, the label stays as it is. VoiceOver's own hint still can't be changed from the page.
     - **In Phase L (option C):** the log verbosity setting also decides the map label. Verbose gives the label with the controls, brief gives "Dungeon map". The player chooses.
     - **Rejected:** keeping it as it is with only "turn hints off" in the README (the supervisors pointed at exactly this), and removing `role="application"` (VoiceOver would take over the arrow keys, decided Nov 4).
   - **Add a start screen and an end screen,** so the game feels whole. Partly planned already: game over exists, and victory and "How to play" are in Agent C's brief. New: a **start screen** (title, a short intro, "How to play", a Start button that gets focus, later also Continue and Log in), and **one end screen** for victory and game over with a **Play again** button. Play again needs a store reset action (a pure function with tests), instead of today's "Reload the page". About 2–3 hours plus a VoiceOver check. The hard part is focus: the last log lines must be read before the end screen takes focus (the same problem as game over on Nov 3–4). **Not decided yet:** priority (suggested: a Must, ahead of potions), who builds it (me or an agent), and when (suggested: start screen with Phase L, end screen with Agent C).

**What gives first if a day slips:** the weekend buffer (Nov 14–15), then the UI skin (the game works without it, so it's the first thing to cut; **cut on Nov 4**, decision 8), then the Playwright path, then the inventory list (the key still works without showing a list, if the pickup and unlock lines are in the log), then the room count stays at 3 even if an agent room needs a lot of fixing (fix it rather than build a fourth).

---

## Timeline

| Day | Work |
| --- | --- |
| Mon Nov 2, afternoon | Re-plan (this file). Tick Phase I. Update the status in `CLAUDE.md`. Read through Phase J |
| Tue Nov 3 | **Phase J:** action menu, focus, choosing a target, "It's your turn" |
| Wed Nov 4 | **Supervision:** demo keyboard combat and the re-plan. Phase J step 7. Start the **Phase K** helpers. **Start Agents A (Phaser rendering) and B (Supabase foundation)** in parallel (decision 7) |
| Thu Nov 5 (morning) | Phase K helpers (steps 1–3, 7) |
| Fri Nov 6 | Phase K step 4 (decor in Tiled). Review and merge **Agent A**, then **start Agent C (exits)**. Review **Agent B** |
| Sun Nov 8 | Review and merge **Agent C**, VoiceOver check of a room change and a locked door. **Start Agent E (items and inventory)**. **Agent spec** ("Building rooms" in `CLAUDE.md`, with the key in room 2 and the locked exit in room 3), start the agents on rooms 2 and 3. Start **Phase L** |
| Mon Nov 9 | Finish **Phase L:** settings. Review **Agent E**. When Phase L and Agent E are merged, **start Agent D (saves and sync)** |
| Tue Nov 10 | **Login and sign-up form** (me) against Agent B's auth client. Review **Agent D** |
| Wed Nov 11 | Wire **sync** to login, check **row-level security** with its tests. Review the agent rooms |
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
1b. **Announce the fight (added Nov 3).** The first line of a new fight says who attacks, before any dice: "The skeleton attacks you! A fight begins." (several enemies: "The skeleton 1 and the orc attack you!"). Without it, a screen reader user heard a step and then initiative numbers with no context. A separate line instead of adding the enemy to the initiative line, so the context comes first and the roll lines stay as they are. `describeCombatStart(combat)` in `narration.ts`, added by `beginCombat`. The direction ("…to the north") comes in Phase K with the reveal narration's direction helper.
   - [x] Done. Claude Code wrote the helper, its tests and the test updates, at my request, to save time
2. **`getAttackOptions(combat)`** in `src/game/`: `{ id, label }` for each living enemy, e.g. `{ id: 'e1', label: 'Attack the skeleton' }`, using the "the skeleton" wording from `narration.ts`. Pure helper, so the button text is unit-tested.
   - [x] Tests written, implemented (in `narration.ts`, so the label uses the same words as the log)
3. **`CombatMenu.tsx`:** a section with a "Your turn" heading and a list of `<button>`s, one per option, each calling `playerAttack(option.id)`. Rendered in `App.tsx` between the game and the log, only while `combat !== null`.
   - [x] Done. Checked by hand: Tab reaches the button, Enter and Space both attack. Claude Code also moved the log beside the map, in its own scrolling box, at my request (Nov 3)
4. **Focus in and out:** one `useEffect` in `CombatMenu`. When the menu appears, save `document.activeElement` and focus the first button. In the effect's cleanup (when the menu disappears), focus the saved element again. After every attack, focus the first remaining button, because the focused one disappears when its enemy dies.
   - [x] Done (Nov 3). **Changed while testing:** the focused button must never disappear while it has focus, or VoiceOver jumps to "main" and drops the queued lines. So after an attack, the click handler moves focus (to the map when the fight ends, or to a button that stays when one enemy of several dies) before React removes the button. The move into the menu at the start of a fight waits 100 ms. Mostly written by Claude Code at my request, starting from my effect.
5. **Assertive announcements:** a visually hidden `aria-live="assertive"` region in `AdventureLog` that holds only the newest assertive line, and a `.visually-hidden` CSS class.
   - [x] Done (Nov 3), **as a `LiveAnnouncer`** instead: two visually hidden regions (polite and assertive) that only hold the newest batch of lines. The visible log is now a plain named region, not a live region. Why: VoiceOver in Safari stopped announcing the growing `role="log"` after about 16 lines. A batch is as urgent as its most urgent line and goes whole to one region, because a separate assertive line interrupted and dropped the polite lines before it. Every other batch gets an invisible non-breaking space, because VoiceOver skips text identical to the previous announcement. Written by Claude Code at my request.
6. **Game over:** when the player falls, show "You have fallen. Reload the page to try again." and move focus to it (the same pattern as the error in `RoomLoader`: `tabIndex={-1}` and `.focus()`). A real "try again" comes with the save layer.
   - **Changed Nov 3–4 (path A):** focus does **not** move to the message. Moving focus there made VoiceOver drop the last batch of lines (the killing blow and the defeat lines), even when playing slowly. Instead, a loss works like a win: the click handler moves focus to the map before the button disappears, and the defeat line in the log carries the message ("Defeat. Game over. Reload the page to try again."). `GameOver.tsx` only shows the visible message. Rule: never move focus to something that doesn't exist yet when the old target disappears.
   - **Also fixed:** two natural 1s in a row, and the second one wasn't read. That line has no numbers, so it was identical, and VoiceOver compares each line on its own. The invisible space now goes on every line of every other batch.
   - **Wording:** the player's line is now "You have fallen." instead of "You are defeated.", so it doesn't say "defeated" right before "Defeat. Game over…". Enemies still get "The demon is defeated."
   - [x] Implemented, all 293 tests pass
   - [x] VoiceOver (Nov 4): a loss reads the whole last batch through to the game over line
   - [x] VoiceOver (Nov 4): a win is unchanged; three wall bumps in a row are all read
7. **VoiceOver check** of a fight with one enemy and with two (the full pass is on Nov 12).
   - [x] VoiceOver (Nov 4): a fight with one enemy and with two (the orc moved next to the demon for the test, then moved back) work as intended
   - **Decided Nov 4: keep `role="application"` on the map.** I can only test VoiceOver on a Mac. On Windows, NVDA and JAWS have a browse mode that catches the arrow keys, and the role is what lets them reach the game. Removing it to fix a VoiceOver hint could break movement for screen reader users I can't test. The hint problem stays a known issue (below), and goes in the WCAG evaluation.
   - [ ] PR reviewed

**Known issues after testing (Nov 3), for step 7 on Wed:**

- **VoiceOver's hints talk over the live regions.** With hints on (the default), the long hint for the `role="application"` map ("You are currently on an application…") and the button hint ("to click this button…") interrupt the announcer: the victory line after focus returns to the map, the log lines in a second fight, and repeated wall bumps. **With hints off (VoiceOver Utility → Verbosity → Hints), everything is read as intended.** **Decided Nov 4: keep `role="application"`** (see step 7) and accept this as a known issue. VoiceOver's hint text can't be changed from the page. For the README and the WCAG evaluation: VoiceOver users get the best experience with hints off. **Nov 5:** the supervisors raised the repeated label too. The label will be shortened when the start screen and its "How to play" exist (decision 9).
- **At the start of a fight, the button is read before the lines** ("Attack the demon, button", then "The demon attacks you!…"). Accepted: nothing is lost, and the button names the enemy.
- **The first log line is read twice after a reload** (found Nov 4). Confirmed part: reading through the log with VO + right arrow read the last line again after the log, from the announcer's hidden copy. **Fixed:** the announcer clears its batch 7 seconds after it appears. Confirmed in VoiceOver (Nov 4).
- **Pressing quickly skips lines** (found Nov 3). Each attack replaces the announcer's batch, and a key press cuts off VoiceOver's speech. Accepted: the player chooses to skip, like skimming, and the full log can be read afterwards (it's focusable). A point for the screen reader pass and the evaluation on Nov 12.

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
5. **Render the dark (Phaser), Agent A (decision 7, also step 6).** **Changed Nov 4 after my playtest:** the radius is 2.5 (rounder than 2, smaller than 3), and the dark is one image with a soft round hole instead of black squares: fully clear up to 2 tiles, black from 3. The high contrast setting will switch to a hard edge (Phase L). The dark is redrawn on every move.
   - [ ] Done
6. **Enemies in the light (Phaser):** enemies drawn only inside the light, looked up through the asset manifest.
   - [ ] Done
7. **Reveal narration:** when an enemy, an exit or a named feature enters the light, log it with a direction ("A barrel appears to the east."). A feature covering several tiles (the two-tile door) is announced once. Pure helper.
   - **Changed Nov 4:** an enemy is announced **every time** it comes into the light, not only once, because the player really lost sight of it. The first time it's "A skeleton appears to the east.", after that "The skeleton appears…", so a screen reader user doesn't think it's a second skeleton. Numbered enemies have no article ("Skeleton 1 appears…"). For this the store keeps `seenEnemyIds`, reset in `loadRoom`. It's only used for the wording: `getNewlyLit` still remembers nothing between steps.
   - [ ] Tests written, implemented, wired into the store
8. - [ ] PR reviewed

**Rough order:** Wed afternoon steps 1–3. Thu morning step 7. Fri morning steps 4–6 and the PR. Fri afternoon exits.

## Exits and room changes (Fri Nov 6)

The room format already has exits (doors and ladders on blocked tiles with a walkable neighbour). What's missing is using them.

**Built by Agent C (decision 7),** after Agent A is merged, because both change `room-scene.ts`. I review the PR and do the VoiceOver check of a room change myself.

**Added Nov 4 (decision 8):** Agent C also adds the **item format** to the room schema (`items: [{ id, type, position }]`, with item types in a Zod-validated table like `enemies.json`) and a **locked exit** (`requires: "<item id>"`). Using a locked exit without the item gives "The door is locked. You need a key." and doesn't leave the room. With the item, it unlocks with a log line. The final exit (step 7) is the locked one. Agent C tests the lock with a fixture inventory. Picking items up comes with Agent E.

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

**Your goal:** you are locked in the dungeon. Find the key and the way out. The key and the locked exit are in different rooms.

**Moving.** Focus the dungeon map and use the arrow keys. Each key press is one step. Walls, objects and enemies block your way, and the adventure log tells you what happened.

**Your lantern.** You can only see about two tiles around you. When something comes into the light, the log tells you what it is and in which direction.

**Fights.** A fight starts when you step next to an enemy. Everyone rolls a 20-sided die for initiative, and the highest roll goes first. You win a tie. On your turn, choose an enemy to attack in the action menu (Tab to move, Enter to choose). You can't move or run away during a fight.

**Attacks.** An attack is a 20-sided die plus your attack bonus. It hits if the total is at least the target's armor class. A natural 20 always hits and is a critical hit: the damage is rolled twice. A natural 1 always misses. Every roll is written in the log.

**Health.** You have 12 health. After you win a fight, you recover 4 health. When you go through a door into a new room, you recover fully. The game warns you when you're down to 3 or less. At 0 you fall, and the game is over.

**Doors.** [key to be decided] Use a door when you're next to it. You can't leave a room during a fight. A locked door opens if you carry its key.

**Items.** Step onto an item to pick it up. Your inventory lists what you carry.

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

## Items and inventory (Agent E, Sun Nov 8 – Mon Nov 9)

Decision 8. Starts after Agent C is merged, because it builds on the item format and changes the store.

1. **Picking up:** stepping onto an item's tile picks it up, with a log line ("You pick up a rusty key."). The item is no longer drawn. Pure helper with tests.
2. **The inventory in the store:** a list of item ids, read by the locked-exit check from Agent C. A room change keeps it, and loading a room doesn't reset it.
3. **Reveal narration:** an item in the light is announced like a feature ("A rusty key lies to the west."), using the Phase K reveal helper.
4. **Drawing items** in Phaser, only inside the light, looked up through the asset manifest (rule 7).
5. **`Inventory.tsx`:** a section with an "Inventory" heading and a `<ul>`, "Empty" when there's nothing. Plain HTML, no focus moves. I check it with VoiceOver.

- [ ] Agent E PR reviewed and merged, corrections logged

## Stretch: potions in containers (Agent F, Wed Nov 11, only if on schedule)

Decided Nov 4 as the **first stretch item**. **Go or no-go on Wed Nov 11 morning:** go only if Agents A–E and both rooms are merged or nearly reviewed. If not, it goes in the report as future work.

**Design (written now, so the room agents can leave room for it):**

1. **Containers are room data:** `containers: [{ id, position, contains: "<item type>" | null }]`, placed on a named blocking decor tile from Phase K (a barrel, a crate). An empty container (`null`) is allowed, so not every barrel has loot.
2. **Searching uses the same key as doors** (Agent C's interact key), next to the container. Not during a fight, the same as exits. Log lines: "You search the barrel and find a health potion." / "The barrel is empty." Searching a container again says it's empty.
3. **A potion is an item type** in the same item table as the key, and goes in the inventory (Agent E).
4. **Drinking:** a "Drink a health potion" button in the combat menu (it uses your turn), and one in the inventory outside fights. **Focus risk:** drinking the last potion removes the focused button. Use the same rule as `CombatMenu` (move focus before the button disappears) and check it in VoiceOver. I write or closely review this focus code myself.
5. **Balance:** how much a potion heals is decided in the balance check (data in the item table, not code).

**Room agents (Sun Nov 8):** they place barrels and crates as named decor as usual. If F goes ahead, I add `containers` to rooms 2 and 3 afterwards. It's only data, so the rooms don't need rebuilding.

- [ ] Go or no-go decided (Wed Nov 11)
- [ ] Agent F PR reviewed and merged, VoiceOver check of drinking the last potion

## UI skin (agent): Pixel RPG UI Pack — **cut on Nov 4** (decision 8)

Kept below for the report ("future improvements"). The font choice stays.

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
- **Font (decided Nov 3):** Pixel Operator everywhere, at 16px or a whole multiple by default. The high contrast setting also switches the **adventure log** to a plain system font, for players who find a pixel font hard to read in long text. The text size setting isn't limited to 2× steps: in-between sizes are a bit soft, but the player's choice wins (WCAG 1.4.4).
- `image-rendering: pixelated` and whole-number scaling, so the art stays sharp. Text size changes must not break the frames.

**License safeguards:** commit only the pieces I use, credit the author in the README with a link, note that I asked for permission on the itch.io page and haven't had a reply (keep a screenshot of the comments), and write it in the report as a known risk. The skin is one stylesheet and one folder, so it can be removed quickly if the author says no.

- [x] Font chosen: **Pixel Operator** (Jayvee Enaguas), CC0, Regular and Bold (Nov 3, in `public/assets/fonts/`)
- [ ] Pieces sliced and exported
- [ ] Brief written
- [ ] UI skin PR reviewed and merged, corrections logged

## Phase L: accessibility settings (Sun Nov 8 – Mon Nov 9)

As written in `docs/sprint-3-plan.md`, Phase L. Settings are saved with the save layer on Tue Nov 10.

- [ ] Settings in the store, with the `prefers-reduced-motion` default (tests)
- [ ] Settings dialog with focus management
- [ ] Text size, high contrast, reduced motion and log verbosity applied (verbosity is a pure helper: I write the tests). High contrast also switches the log to a system font (decided Nov 3, see "UI skin"), and draws the lantern light with a hard edge instead of a soft fade (decided Nov 4), so lit and dark tiles are easy to tell apart
- [ ] Log verbosity also decides the map's label: verbose gives "Dungeon map. Use the arrow keys to move.", brief gives "Dungeon map" (decision 9, option C). **Check first** whether it's still needed once the start screen has "How to play" (option B)
- [ ] PR reviewed

## Saves, accounts and sync (Tue Nov 10 – Wed Nov 11)

Rule 8: local-first. Saves and settings always go to localStorage; when logged in they also go to Supabase, and the most recently updated version wins. Guest and logged-in mode use the same code path.

**Split (decision 7):** Agent B builds the Supabase foundation from Nov 4 (SQL tables, RLS policies and their tests, the auth client), in new files only. Agent D builds guest saves and sync after Phase L and Agent E, because saves need the settings shape and the inventory. I write the login and sign-up form myself, and review the RLS policies line by line.

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
