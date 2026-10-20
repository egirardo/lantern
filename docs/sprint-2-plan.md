# Sprint 2 plan: Reference room, core gameplay (Oct 19–25)

**Goal:** the player moves around the reference room on the deployed site, every move is announced in the adventure log, and the lantern visibility rules are written and tested.

This sprint starts behind schedule: Phase B step 4 and Phases C–E from Sprint 1 weren't finished by Oct 18 (see "Status at end of sprint" in `docs/sprint-1-plan.md`). Finishing them comes first, so the original Sprint 2 scope is reduced. See "Moved to Sprint 3" below.

**Planning rule:** the sprint is planned on weekdays only (Mon–Fri). Weekend work is a bonus, not part of the plan. If I do get time on the weekend, I take tasks from the "Stretch" list.

**Who does what** (same as Sprint 1)

- **Elsa** writes all reference room code and runs all installs.
- **Claude** writes tooling and config, explains concepts, reviews PRs and gives hints on request.

---

## Part 1 — Finish Sprint 1 (Mon–Thu)

The steps are described in `docs/sprint-1-plan.md`. Tick them off here.

- [x] **Phase B step 4: `loadRoom`.** Also check that every exit is inside the grid and on a walkable tile (from my open reminders). Decide where the missing-floor check lives while writing it.
  - [x] Test: a start position inside a wall fails
  - [x] Test: a start position outside the grid fails
  - [x] Test: an exit inside a wall or outside the grid fails
  - [x] Phase B done, PR reviewed
- [x] **Phase C: narration and store**, PR reviewed
- [x] **Phase D: the reference room in Tiled**
- [ ] **Phase E: Phaser rendering and keyboard input**, PR reviewed. First decide what data Phaser gets (open reminder: `tiledSchema` strips fields Phaser needs). Ask Claude.
- [ ] **Deployed to `dev`, then released to `main`.** This is the Sprint 1 goal.

---

## Part 2 — New Sprint 2 work (Fri)

### Phase F — Adventure log as a live region (`src/ui/`)

Phase E gives a plain `<ol>` of log entries. Phase F makes screen readers announce new entries.

1. Wrap the list in an element with `role="log"`. That role has `aria-live="polite"` built in, so new entries are read out when the screen reader is idle, without interrupting.
2. Give the log a visible heading (e.g. "Adventure log") and connect it with `aria-labelledby`.
3. Use each entry's `id` as the React `key`, never the array index.
4. **Test with VoiceOver:** move into a wall twice and check that both messages are announced.

> **Concept: live regions.** A screen reader only reads what has focus. A live region is a part of the page that the screen reader watches, so it reads out changes even though focus stays on the game. `polite` waits for a pause; `assertive` interrupts, so it's saved for urgent events like low health (later sprint).

**Pitfalls**

- The live region must already be **in the DOM, empty, before the first message is added**. If the whole region appears together with its first message, many screen readers stay silent.
- With the index as key, React may re-render old entries as if they were new, and the screen reader can read them all again.
- Don't move focus into the log. Focus stays on the game region, so the arrow keys keep working.

- [ ] Phase F done, tested with VoiceOver, PR reviewed

### Phase G — Lantern visibility rules (`src/game/visibility.ts`)

Pure logic only, test-first. Rendering in Phaser comes in Sprint 3.

1. **Decide first:**
   - **Shape of the light.** Square (Chebyshev distance: `max(|dx|, |dy|)`), diamond (Manhattan: `|dx| + |dy|`) or round (Euclidean: `dx² + dy² <= r²`). Draw each on paper with radius 2 and pick the one that looks like a lantern.
   - **Function shape.** For example `isVisible(from, to, radius)`, or `getVisibleTiles(grid, position, radius)` that returns a list of positions.
   - **Walls:** v1 doesn't check line of sight, so the light shines "through" walls. That's a deliberate simplification. Raycasting is an idea for later, not this sprint.
2. **Write the tests first:**
   - [ ] The player's own tile is visible
   - [ ] A tile exactly at the radius is visible
   - [ ] A tile just outside the radius isn't visible
   - [ ] Near the edge of the map, no positions outside the grid are returned
   - [ ] The input position isn't mutated

> **Concept: derived state.** What the player can see follows directly from their position and the radius, so it doesn't need to be stored in the Zustand store. Phaser and React can calculate it from the state when they need it. Storing it would mean two values that can drift apart (rule 2, one source of truth). Tiles the player has *already seen* are different: that's memory, not something you can calculate, so it would be real state. Decide in Sprint 3 if the game remembers explored tiles.

**Pitfall:** like movement, grids are `grid[y][x]`. A test with a non-square map catches a mix-up.

- [ ] Phase G done, PR reviewed

---

## Moved to Sprint 3

- **Lantern rendering in Phaser** (darkness outside the light) and **narration of what the light reveals.** Both build on Phase G.
- **Dice** (`rollDie` with an injectable random function, so tests can control the result).
- **Combat rules and enemy types.** Once combat works for one enemy, the other two are mostly room data (rule 6).
- **Keyboard action menus.** They go together with focus management, which is already in Sprint 3.

Sprint 3 gets heavier because of this. The knock-on changes are listed under "Plan changes" in `docs/project-plan.md`.

## Stretch (only if there's extra time, e.g. a weekend)

In this order:

1. Dice, pure logic and tests
2. Lantern rendering in Phaser

---

## Supervision Oct 21

The original plan was to demo movement, the lantern and early combat. That won't be ready. Show instead:

- What runs: the pure logic and the tests (movement, room schema, Tiled schema, `buildGrid`, `loadRoom`), and whatever of Phases C–E is done by then
- The revised plan: what slipped, why, what moved to Sprint 3, and that the project plan already names Sprint 5 as the buffer for delays
- Questions for the supervisor (write them down before the meeting)

---

## Timeline

| Date        | Claude                                   | Elsa                                         |
| ----------- | ---------------------------------------- | -------------------------------------------- |
| Mon Oct 19  | Sprint 2 plan, review `loadRoom`         | Phase B step 4 (`loadRoom`), PR. Start Phase C |
| Tue Oct 20  | Reviews, hints on Zustand                | Phase C (store), Phase D (Tiled room)        |
| Wed Oct 21  | Help with the Phaser data decision       | **Supervision.** Start Phase E               |
| Thu Oct 22  | Reviews                                  | Finish Phase E, deploy, release to `main`    |
| Fri Oct 23  | Reviews, AI log summary                  | Phase F (live region), Phase G (visibility)  |
| Weekend     | —                                        | Optional: stretch list                       |
