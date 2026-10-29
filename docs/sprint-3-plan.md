# Sprint 3 plan: Reference room, combat and accessibility (Oct 26–Nov 1)

**Goal:** the reference room is a playable game: the player explores with a lantern, meets three enemy types and fights them with dice, using keyboard-driven action menus, and every event is in the adventure log.

Sprints 1 and 2 ran over, so Sprint 3 effectively starts on **Wed Oct 28**. The days available are Wed, Thu, Fri and **both weekend days** (Sat and Sun), so **5 working days**, two of them on the weekend. The original Sprint 3 scope (settings, screen reader testing, Playwright, agent spec) plus everything moved from Sprint 2 still does not fit in 5 days. This plan fills the 5 days with the core game loop first, then accessibility settings, and lists what spills into Sprint 4 (see "Doesn't fit" below).

**Planning rule:** weekdays are the plan. The weekend days are extra time I chose to add. If they don't happen, Phase K and Phase L move to Monday and Sprint 4 shifts. If only one happens, do Phase K and let Phase L slip.

**Who does what** (same as before)

- **Elsa** writes all reference room code and runs all installs.
- **Claude** writes tooling and config, explains concepts, reviews PRs and gives hints on request.

---

## Decisions to make first (Wed morning, before any code)

Write the answers in `docs/learning-notes.md` under Decisions. Ask Claude to talk through them. My recommendation is in bold, to cut scope, not to decide for me.

1. **Turn structure.** Free movement while exploring, strict turns only in combat (how D&D does it). **In combat v1, a turn is one action (attack, use item, flee).** Movement per turn, tile scale (5 ft vs 10 ft per tile) and diagonal movement are left out of Sprint 3 and parked in the Sprint 2 plan under "Moved to Sprint 3". They are big decisions with little payoff for the Musts.
2. **Who can fight whom.** **Melee only: the player and an enemy must be on adjacent tiles.** Ranged attacks are not planned.
3. **Light radius.** Pick a number for the reference room (the room is about 11×9, so 3 or 4). It stays a parameter.
4. **Explored tiles.** Does the game remember tiles the player has seen? **No for v1: only what the lantern lights right now is visible.** Remembering is real state (see the concept in the Sprint 2 plan) and can come later.
5. **Enemy stats.** Three types, written as data (rule 6), each with hit points, armor class, attack bonus, an initiative bonus (values to pick in Phase I) and damage die. Keep the numbers small (decided: `skeleton` HP 4, AC 10, +2, d4; `demon` HP 8, AC 12, +3, d6; `orc` HP 6, AC 13, +4, d6). The sprites are in the tileset image but not yet in `sprites.json` or the asset manifest, so adding them is the first step of Phase I.
6. **Where combat state lives.** In the Zustand store (rule 2), with the rules as pure functions in `src/game/` that take the state and a random function and return the new state plus a list of events.
7. **Initiative** (added Oct 28). Everyone rolls d20 + an initiative bonus once at the start of combat, and a tie goes to the player. See Phase H step 3.

- [x] Decisions written down (in `docs/learning-notes.md`)

---

## Wed Oct 28 — Phase H: dice and combat rules (`src/game/`)

Pure logic, test-first. No Phaser, no React (rule 1).

1. **Dice.** `rollDie(sides, random)`, where `random` is injected (defaults to `Math.random`) so tests can control the result.
   - [x] Test: with `random` returning 0 the result is 1, and just under 1 gives `sides`
   - [x] Test: a `d20` never returns 0 or 21 (done as one test that checks every face of d4, d6 and d20)
2. **Attack roll.** D&D style: roll a d20 + attack bonus, hit if it's at least the target's armor class. A natural 20 always hits and is a critical hit: the damage die is rolled twice and the results added (D&D style, decided Oct 28). A natural 1 always misses. Damage is the weapon die.
   - [x] Tests: hit, miss, natural 20 (critical, double damage), natural 1, hit points never below 0 (damage below 1 does nothing, decided Oct 28)
3. **Combat state, initiative and turn order** (initiative added Oct 28). Everyone, including the player, rolls a d20 plus an `initiativeBonus` once at the start of combat. A tie goes to the player. The state holds the turn order as a list of ids and the index of whose turn it is. Combat ends when all enemies are at 0 or the player is at 0 (or flees). The status is calculated from health, not stored. Enemies are wrapped as `{ id, combatant }` in the state, and events refer to combatants by id.
   - Functions: `startCombat(player, enemies, random)` rolls initiative and returns `{ state, events }`, `resolvePlayerAttack(state, targetId, random)`, and `resolveEnemyTurns(state, random)`, which runs enemy turns until it's the player's turn again or combat ends. If enemies go first, they act before the player's menu appears.
   - [x] Tests: initiative order, a tie goes to the player, the player can go first or last, the turn passes to enemies after a player action, a dead enemy doesn't act, combat ends when the last enemy dies, the player reaching 0 ends combat, unknown or dead target id, the input state is never changed
4. **Events, not text.** Each function returns events like `{ type: 'attack', attacker, target, roll, hit, damage }`, plus an `initiative` event per combatant (id, roll, total), `defeated` and `combat-ended`. Turning events into sentences is narration's job (next phase).

> **Concept: injecting randomness.** A function that calls `Math.random()` inside can't be tested reliably. If the random function is a parameter, a test passes in a fake one that always returns the same number, so the result is predictable. This is called dependency injection, and it's the simplest kind.

**Pitfalls**

- Don't mutate the state you receive. Return a new object (same rule as `movePlayer`).
- A "miss" and a "hit for 0" are different events. Keep them separate so narration can describe them differently.

- [x] Phase H done, PR reviewed

---

## Thu Oct 29 — Phase I: enemies as data, combat in the store, combat narration

1. **Enemies in the room format.** Add `enemies` to `room-schema.ts` (type, position) and the enemy stat table (a Zod-validated data file, not code). Add the three enemies to `entrance-hall.json`. Sprites are looked up by logical name through the manifest (rule 7).
   - [x] Test: an enemy outside the grid or on a wall tile fails in `loadRoom` (also on the player start and on another enemy)
   - [x] Test: an unknown enemy type fails the schema
2. **Combat in the store.** Starting combat when the player moves next to an enemy (or presses an "attack" key), actions that call the Phase H functions, and the events pushed to the log.
3. **Narration (`narration.ts`).** Events become sentences ("You swing at the giant rat and hit for 3 damage."). Every combat event produces text (rule 5), including enemy deaths and the roll results. Keep the roll numbers in the text so a screen reader user gets the same information as someone watching.
   - [x] Tests for each event type
4. **Low health.** The one `assertive` announcement planned for this project. Decide the threshold (e.g. a quarter of max hit points) and announce once when crossing it, not on every hit.

**Pitfalls**

- Phaser draws enemies from the store and does not decide anything (rule 3). Drawing an enemy sprite must not need game rules.
- Defeated enemies must disappear from the store, not only from the canvas.
- Keep the log from flooding: one sentence per event, no repeated descriptions every turn.

- [ ] Phase I done, PR reviewed

---

## Fri Oct 30 — Phase J: keyboard action menus and focus management (`src/ui/`)

1. **Action menu in combat.** Real `<button>`s in a list (semantic HTML first): Attack, and later Use item and Flee. Arrow keys or Tab to move, Enter to choose.
2. **Focus rules** (from CLAUDE.md): when the menu opens, focus moves into it; when combat ends, focus returns to the game region so the arrow keys work again. Never leave focus on a button that disappeared.
3. **Targeting.** If more than one enemy is adjacent, the player chooses the target from a list of names (not by clicking the canvas).
4. **Disabled actions.** Say why in text ("Flee isn't available yet"), not only by greying out.
5. **Enemies first.** If initiative lets enemies act before the player, the log must say "It's your turn" when the player's turn starts, and focus must land in the action menu only after that.
6. **Test with VoiceOver:** run a whole fight with the keyboard only. Is every roll and result announced, once, in a sensible order? Does focus end up where you expect?

> **Concept: focus management.** Browsers keep one focused element. If it's removed from the page, focus drops to the top of the document, which is disorienting for a screen reader user. Save the element that had focus before the menu opened, and call `.focus()` on it when the menu closes.

**Pitfalls**

- Don't move focus into the log (same as Phase F).
- The game region's arrow-key handler must not fire while the menu has focus, or arrow keys will both move the player and navigate the menu.
- Wait for the player: no timers anywhere.

- [ ] Phase J done, tested with VoiceOver, PR reviewed

---

## Sat Oct 31 — Phase K: lantern rendering and narration (`src/phaser/`, `src/game/`)

Builds on Phase G (`getVisibleTiles`) and the radius from the decisions.

1. **Render the dark.** In `room-scene.ts`, draw tiles outside the light as black (or a very dark overlay) and redraw when the player moves. Phaser reads the visible tiles from `getVisibleTiles`; it doesn't calculate anything itself (rule 3).
2. **Enemies in the dark.** Enemies outside the light are not drawn.
3. **Narration of what the light reveals.** When something new enters the light (an enemy, a door), log it once, with a direction ("A door appears to the north"). This is the accessible version of the canvas effect (rule 5). Don't announce the same thing twice.
4. **Never by darkness alone.** If dark tiles carry information (e.g. where the walls are), that information must also be reachable in text.
5. **Check the Open reminders** that touch `room-scene.ts` (destroy old layers when redrawing) and fix them if this phase makes them matter.

**Pitfalls**

- Reduced motion: no fade or flicker animation on the light. A hard edge is fine and is the default for now.
- Contrast: the lit area must have enough contrast against the dark. Check it against high contrast mode once settings exist.

- [ ] Phase K done, PR reviewed

---

## Sun Nov 1 — Phase L: accessibility settings (`src/state/`, `src/ui/`)

The four settings from the Musts: reduced motion, high contrast, text size and log verbosity. This phase only builds the settings and applies them; saving them (localStorage, then Supabase) comes with the save layer in Sprint 4.

1. **Settings in the store.** One `settings` object in the Zustand store with defaults. The reduced motion default comes from `prefers-reduced-motion`. Pure logic (the defaults and any helper) gets unit tests.
   - [ ] Test: defaults are correct, and the `prefers-reduced-motion` default is respected
2. **A settings dialog in React.** Real form controls (checkbox, radio group or select), each with a visible label. Opening it moves focus into it, closing returns focus to where it was (same pattern as Phase J).
3. **Apply them.**
   - *Text size:* a CSS variable on the root, in `rem`, so the browser's own text zoom still works.
   - *High contrast:* a class or `data-` attribute on the root that swaps the colour variables. Check the lantern's lit and dark areas too.
   - *Reduced motion:* Phaser reads it from the store and skips any animation (Phase K has none yet, but the player movement may).
   - *Log verbosity:* narration functions take the level and return fewer sentences at "brief" (e.g. skip the roll numbers, only say the result). Pure functions, so they can be tested.
4. **Never by colour alone** applies to every new control.

**Pitfalls**

- Keep settings in the store, not in component state (rule 2), or Phaser can't see them.
- Don't flood: log verbosity must not remove information a screen reader user needs, only how it's worded. Decide what "brief" keeps before writing it.

- [ ] Phase L done, PR reviewed
- [ ] Deployed to `dev`

---

## Doesn't fit in the 4 days

These were in Sprint 3 and are **not planned** here. They move to Sprint 4's start, which needs a decision (see below).

| Item | MoSCoW | Why it matters next |
| ---- | ------ | ------------------- |
| Full-room screen reader test (VoiceOver, and NVDA if I can) | Must | The Definition of Done requires it for every feature. Phases F and J are only tested on their own, and the settings need a pass too. |
| Guest mode with local saves | Must | Already moved to Sprint 4 (see Plan changes), same save layer as sync. |
| Playwright and axe-core tests | Should | Needs a stable room first. |
| The "Building rooms (for agents)" section in `CLAUDE.md` | Must for the agent workflow | Agents can't start until the reference room is finished and this is written. Needs combat, enemies and exits to exist. |
| Exits and room changes (`dingy-basement` doesn't exist) | Must | Also blocks the agent-built rooms. |

**Decided Oct 28: option A, Sprint 5 is the buffer.** Sprint 4 already holds accounts, row-level security, agent PR reviews and the Nov 4 supervision. Adding the table above means something has to give. Settings are now done in Sprint 3 (Phase L), which makes this easier. The options were:

- **A. Use Sprint 5 as the buffer it was planned to be (chosen).** The screen reader pass and the agent spec go in Mon–Tue of Sprint 4. Accounts start Wed. Inventory and colorblind design (Should) become the first things cut.
- **B. Cut Playwright and axe-core to a minimum** (a single keyboard path and one axe scan on the main page), so the saved time goes to the screen reader pass and the agent spec.
- **C. Reduce the dungeon to 3 rooms** (the plan B from the risks section). Agents build fewer rooms, so less review time.

Recorded in `docs/project-plan.md` under "Plan changes". Playwright, axe-core and guest saves can start in Sprint 4 or move into Sprint 5; plan that at the start of Sprint 4.

---

## Dropped for now

Not planned, only parked:

- Dim ring around the lantern, and the idea of explored-tile memory (Sprint 2 plan, "Moved to Sprint 3")
- Movement per turn, tile scale and diagonal movement
- Inventory (Should, Sprint 5)

---

## Timeline

| Date        | Claude                                       | Elsa                                              |
| ----------- | -------------------------------------------- | ------------------------------------------------- |
| Wed Oct 28  | Talk through the decisions, review Phase H   | Decisions, Phase H (dice, combat rules, tests)    |
| Thu Oct 29  | Review, hints on schema and the store        | Phase I (enemies as data, combat in store, narration) |
| Fri Oct 30  | Review, hints on focus management            | Phase J (action menus, focus), VoiceOver test     |
| Sat Oct 31  | Review (when I'm asked)                      | Phase K (lantern rendering and narration)         |
| Sun Nov 1   | Review, draft AI log entries, update status  | Phase L (settings), deploy to `dev`, check what's left for Sprint 4 |
