# AI log

A record of how AI tools were used in Lantern, kept throughout the project and summarized in the final report.

**Tools:** Claude (learning, planning, problem solving), Claude Code (coding agent), GitHub Copilot (code completion and PR review). No AI image generation: art is a CC0 asset pack, plus any custom art made by hand in Aseprite.

## How to log

Add one entry per meaningful use, newest at the bottom of each sprint. Skip trivial autocomplete.

**Categories** (from the project plan):

- **Planning:** sprint plans, architecture decisions
- **Learning:** explanations of Phaser, Tiled, Supabase and other new tech
- **Coding:** code written or changed by an AI tool
- **Review:** AI review of my code (Claude Code, Copilot)
- **Security:** review of Supabase RLS policies, verified by testing
- **Accessibility:** AI review of components, verified against WCAG and screen reader testing
- **Agent rooms:** rooms 2–5 built by agents (also logged in the evaluation table below)
- **Documentation:** docs, READMEs, PR descriptions

**Outcome:** ✅ kept · ✏️ kept with changes · ❌ rejected

### Entry template

```markdown
#### YYYY-MM-DD — Short title

- **Tool:** Claude Code / Claude / Copilot
- **Category:**
- **What I asked:**
- **What I got:**
- **Outcome:** ✅ / ✏️ / ❌
- **Why:** what I kept, changed or rejected, and why
- **How I verified it:** tests, manual check, docs, screen reader…
```

---

## Sprint 1 (Oct 12–18): Foundation

<!-- Draft entries written by Claude Code from the session on Oct 13. Review and rewrite in your own words. -->

#### 2026-10-13 — Sprint 1 plan

- **Tool:** Claude Code
- **Category:** Planning
- **What I asked:** Read `CLAUDE.md` and the project plan and propose a plan for Sprint 1, plus a step-by-step guide for writing the reference room myself.
- **What I got:** An ordered plan of small PRs, saved as `docs/sprint-1-plan.md`, with Phases A–E for the reference room code.
- **Outcome:** ✏️
- **Why:** Kept the plan. Chose plain Vite over Phaser's React template, because the template's EventBus would compete with Zustand as a second source of truth. Decided that I run all installs and write all reference room code, while Claude Code handles tooling and reviews. Moved later-sprint notes into their own section, because they were confusing.
- **How I verified it:** Compared against the MoSCoW priorities and sprint plan in `docs/project-plan.md`.

#### 2026-10-13 — Project scaffold and tooling

- **Tool:** Claude Code
- **Category:** Coding
- **What I asked:** Set up config after I ran the installs myself.
- **What I got:** Strict TypeScript, ESLint with `jsx-a11y`, Prettier, Vitest, npm scripts, folder structure, a Phaser mount component, and a lint rule blocking Phaser/React/Zustand imports in `src/game/`.
- **Outcome:** ✅
- **Why:** Claude Code caught that the Vite template doesn't enable strict mode, and that I had installed `phase` instead of `phaser`. Chose ESLint 9 over 10, because `jsx-a11y` doesn't support 10 yet.
- **How I verified it:** Typecheck, lint, tests and build pass. Tested the import rule with a temporary file.

#### 2026-10-13 — Copilot review: lint rule

- **Tool:** Copilot
- **Category:** Review
- **What I asked:** Automatic PR review of the scaffold.
- **What I got:** A claim that the import rule misses subpath imports like `react/jsx-runtime`.
- **Outcome:** ❌ (but led to a different fix)
- **Why:** The claim was false: the `patterns` option uses gitignore-style matching, so subpaths are blocked. While checking, Claude Code found a real gap (`.tsx` files weren't covered), which was fixed.
- **How I verified it:** Temporary test file with each import, run through ESLint.

#### 2026-10-13 — CI, Vercel and branch protection

- **Tool:** Claude Code
- **Category:** Coding / Learning
- **What I asked:** Set up GitHub Actions and explain Vercel and branch protection setup.
- **What I got:** A CI workflow (lint, typecheck, format, test, build), instructions for rulesets and Vercel, and a `feature → dev → main` flow with `dev` as pre-production.
- **Outcome:** ✏️
- **Why:** Some instructions were outdated (Vercel moved the production branch setting to Environments). Claude Code explained why production showed `dev` at first.
- **How I verified it:** CI ran on PRs. Production deployed from `main` after the first release.

#### 2026-10-13 — Movement rules (Phase A)

- **Tool:** Claude Code
- **Category:** Review / Learning
- **What I asked:** Hints on writing tests, and reviews of my tests and `movePlayer`.
- **What I got:** Explanations of Vitest, Arrange-Act-Assert, TDD and discriminated unions. Reviews found x/y mix-ups in my tests, tests that built their own expected result, and an edge test that started outside the grid.
- **Outcome:** ✏️
- **Why:** I wrote the types, tests and function. Claude Code fixed the south edge test, fixed properties broken by a rename, and refactored the `switch` to a `Record` lookup table at my request. I chose a two-shape `MoveResult` union over a simpler single field, because blocked moves will likely need extra data later.
- **How I verified it:** All tests pass. Broke the bounds checks on purpose (`>=` → `>`) to confirm the tests catch it.

#### 2026-10-13 — Copilot review: movement

- **Tool:** Copilot
- **Category:** Review
- **What I asked:** PR review of `movePlayer`.
- **What I got:** Two claims: an empty grid throws, and a ragged grid allows a move onto a missing tile.
- **Outcome:** ✏️
- **Why:** The ragged grid bug was real and is fixed, with regression tests. The empty grid claim was false, because `||` short-circuits before `grid[0].length`. Also turned on `noUncheckedIndexedAccess`, which flagged both risky lookups immediately. Claude Code first recommended a different fix than Copilot, then changed its recommendation once the flag was on, because the flag made Copilot's approach the clearer one.
- **How I verified it:** Ran `movePlayer` on both grids before the fix. The regression test failed before the fix and passed after.

#### 2026-10-13 — Supabase project setup

- **Tool:** Claude Code
- **Category:** Learning / Security
- **What I asked:** Which Supabase settings to choose, and whether to connect GitHub now.
- **What I got:** Advice to turn off "Automatically expose new tables" and turn on automatic RLS, to keep plain Postgres, and to wait with the GitHub integration until Sprint 4. Also `.env.example` and safer `.gitignore` rules.
- **Outcome:** ✅
- **Why:** New tables now need both a grant and RLS policies before anyone can access them.
- **How I verified it:** Checked that `.env.local` is ignored by Git.

#### 2026-10-13 — Setup troubleshooting

- **Tool:** Claude Code
- **Category:** Learning
- **What I asked:** Help with an `ERESOLVE` npm error, and what to do about the Node version warning.
- **What I got:** An explanation of peer dependencies (`jsx-a11y` only supports ESLint ≤ 9), three options with trade-offs, and steps for switching to Node 24 with nvm.fish.
- **Outcome:** ✅
- **Why:** Chose to downgrade ESLint to 9 to keep accessibility linting. Claude Code checked how Node was installed on my machine before giving instructions, and noticed that I use the fish shell.
- **How I verified it:** Installs succeeded and lint runs with `jsx-a11y`.

#### 2026-10-13 — Learning notes and CLAUDE.md instructions

- **Tool:** Claude Code
- **Category:** Documentation / Learning
- **What I asked:** A personal, gitignored notes file to keep track of what I learn, and instructions in `CLAUDE.md` so Claude Code keeps it updated.
- **What I got:** `docs/learning-notes.md` (concepts, gotchas, decisions with reasons, open reminders), updated throughout the session, plus a "Learning notes" section in `CLAUDE.md`.
- **Outcome:** ✅
- **Why:** A lot of useful explanations would otherwise get lost in the chat. The "decisions and why" table will help when I defend the project.
- **How I verified it:** Checked that the file is ignored by Git. Read through the notes.

#### 2026-10-13 — README stub

- **Tool:** Claude Code
- **Category:** Documentation
- **What I asked:** Whether to commit Vite's default README.
- **What I got:** Agreement that it shouldn't be committed as-is, and a short stub README (pitch, status, tech stack, setup, scripts).
- **Outcome:** ✅
- **Why:** The default described Vite, not Lantern. The full README comes before submission.
- **How I verified it:** Read it. Prettier passes.

#### 2026-10-13 — Git and GitHub workflow questions

- **Tool:** Claude Code
- **Category:** Learning
- **What I asked:** When to merge into `dev` and `main`, which merge method to use, why `main` is "1 commit ahead", whether to delete feature branches, and how to stop Copilot's automatic reviews.
- **What I got:** Explanations of merge commits vs squash (always a merge commit for `dev` → `main`), why the merge commit makes `main` "ahead", and how to delete branches safely. It also checked my rulesets through the GitHub API, which helped me find that Copilot auto-review was on in my personal settings.
- **Outcome:** ✏️
- **Why:** At first Claude Code gave a contradictory explanation of whether "Automatically delete head branches" could delete `dev`. When I asked if it was absolutely sure, it checked GitHub's docs and my ruleset (deletion rule, empty bypass list) and corrected the explanation. A reminder to push back on confident answers.
- **How I verified it:** GitHub docs, ruleset settings through the API. To do: confirm `dev` survives the next release.

#### 2026-10-13 — Comment convention change

- **Tool:** Claude Code
- **Category:** Planning
- **What I asked:** To keep my explanatory comments, after Claude Code flagged them as repeating the code.
- **What I got:** An update to `CLAUDE.md`: comments explaining *what* code does are welcome while I'm learning, aren't flagged in reviews, and Claude Code adds similar ones to its own code.
- **Outcome:** ✅
- **Why:** Comments in my own words help me understand and present the code. The original rule ("comment the why, not the what") suits experienced developers more than someone learning the stack.
- **How I verified it:** Reviewed the `CLAUDE.md` change in the movement PR.

#### 2026-10-13 — PR descriptions and AI log template

- **Tool:** Claude Code
- **Category:** Documentation
- **What I asked:** PR descriptions for each PR (#1–#5), and an AI log template based on the project plan.
- **What I got:** Descriptions with summary, changes, how to test and an AI use section, and this log with a template, Sprint 1 entries, a table for evaluating agent-built rooms and summary headings.
- **Outcome:** ✏️
- **Why:** Kept the structure. Each PR description separates my work from AI work, which supports the agent evaluation later. The log entries were drafted by Claude Code, and I review them.
- **How I verified it:** Read each description before pasting it. Checked the descriptions against the actual changes.

<!-- Draft entries written by Claude Code from the session on Oct 14. Review and rewrite in your own words. -->

#### 2026-10-14 — Asset pack review: licenses and scope

- **Tool:** Claude Code
- **Category:** Planning / Learning
- **What I asked:** How to bring in two asset packs: Tangerine Tavern for a tavern intro, and DungeonTileset II Extended for the dungeon. Also whether a Pixel RPG UI Pack would work.
- **What I got:** A license check of each pack's itch.io page:
  - The dungeon pack is CC0.
  - Tangerine Tavern is **CC BY-SA 4.0**, not CC0 as my plan requires. Credit is required, and a recolored version would have to be shared under the same license.
  - The UI pack has a custom license that doesn't mention redistribution.

  It also pointed out that the tavern intro is a **Could** item in my MoSCoW, and that building it now would take time from the Musts.
- **Outcome:** ✅
- **Why:** Decided to bring in only the dungeon pack now and wait with the tavern until the Could item. That also postpones the license question and the recolor work. For the UI pack, I'll ask the author about redistribution before committing it. I also got accessibility guidance for using it: decoration around real HTML text (WCAG 1.4.5), contrast and a readable font.
- **How I verified it:** Read the license text on each itch.io page. Checked the MoSCoW in `docs/project-plan.md`.

#### 2026-10-14 — Analysing the dungeon sprite sheet

- **Tool:** Claude Code
- **Category:** Learning
- **What I asked:** To look through the unzipped packs (kept outside the repo in `lantern-assets/`).
- **What I got:** The pack is a single 1024×1024 sheet with no list of sprite positions. Claude Code wrote a small script (Node built-ins only) that measured every sprite:
  - Floor and wall tiles sit on the 16×16 grid, so Tiled can use the sheet directly.
  - Characters don't fit a 16×16 grid but do fit a **16×32 grid**, with 9 frames per character (idle, run, hit).

  It rendered zoomed crops to identify the two heroes, and explained sprite sheets vs texture atlases.
- **Outcome:** ✅
- **Why:** Measuring was faster and more exact than guessing positions or marking them by hand. I chose that over making the atlas in Aseprite for now, since custom Aseprite art is a Could for Sprint 6.
- **How I verified it:** Looked at the zoomed crops with grid lines. Every frame sits inside its cell.

#### 2026-10-14 — Character choice (idea)

- **Tool:** Claude Code
- **Category:** Planning / Accessibility
- **What I asked:** Whether the player could choose between the blond girl and the blond boy.
- **What I got:** Advice to include both in the atlas now (cheap) and build the choice screen later, together with saves, since the choice has to be saved. Accessibility guidance: a radio group with a text description of each character for screen reader users. Also a note that the log is written in second person ("You step north"), so the choice doesn't require any gendered text.
- **Outcome:** ✅
- **Why:** Not in my MoSCoW yet. I need to add it as a Should or a Could.
- **How I verified it:** Compared against the MoSCoW and the accessibility requirements in `CLAUDE.md`.

#### 2026-10-14 — Asset manifest and atlas (Step 4)

- **Tool:** Claude Code
- **Category:** Coding
- **What I asked:** To bring the dungeon pack into the project according to the plan.
- **What I got:**
  - The sheet in `public/assets/dungeon/`, with a `LICENSE.txt`
  - A generated Phaser atlas (`sprites.json`) with 18 hero frames
  - `src/assets/manifest.ts`, mapping logical names to textures, a tileset and sprite animations
  - A test that fails if the manifest refers to a frame the atlas doesn't have
  - Asset credits in the README
- **Outcome:** ✅
- **Why:** Follows architecture rule 7 (art referenced by name). The manifest is plain data with no Phaser imports. New TypeScript concepts for me: `as const`, `satisfies` and `keyof typeof`.
- **How I verified it:** Claude Code rendered three atlas frames to check they match the image, and broke a frame number on purpose to confirm the test fails. All checks pass in CI.

#### 2026-10-14 — Lost uncommitted changes with `git checkout <file>`

- **Tool:** Claude Code
- **Category:** Learning
- **What I asked:** Why my AI log changes disappeared after I ran `git checkout docs/ai-log.md`.
- **What I got:** An explanation: `git checkout <file>` resets a file to its last commit and discards uncommitted changes without warning. Claude Code recovered the text from the conversation, and recommended `git switch` (branches) and `git restore` (files), which can't be confused with each other.
- **Outcome:** ✅
- **Why:** A good lesson in a Git command with two very different meanings.
- **How I verified it:** Checked the reflog and status. The changes had never been committed, so only the conversation had a copy.

<!-- Draft entries written by Claude Code from the session on Oct 15. Review and rewrite in your own words. -->

#### 2026-10-15 — Learning Zod

- **Tool:** Claude Code
- **Category:** Learning
- **What I asked:** Help getting started with the Zod room schema (Phase B), since Zod is new to me.
- **What I got:** An introduction using a different example (a library book):
  - why runtime validation is needed (TypeScript types disappear when the code runs)
  - the building blocks
  - `safeParse` vs `parse`, and `z.infer`
  - `z.strictObject`, which rejects misspelled keys

  Claude Code first tested every feature against my installed version (Zod 4.6), because Zod 4 changed some APIs compared to older tutorials.
- **Outcome:** ✅
- **Why:** Using a different example meant I still wrote the room schema myself. `strictObject` matters for agent-built rooms: a typo like `descripton` should be an error, not silently ignored.
- **How I verified it:** Claude Code ran the examples against my installed Zod and showed the real error output.

#### 2026-10-15 — Room schema reviews

- **Tool:** Claude Code
- **Category:** Review / Learning
- **What I asked:** Three reviews of `src/rooms/room-schema.ts`, and help with one fix.
- **What I got:**
  - First review: empty strings passed (an empty description would make a room silent for screen reader users), and `.trim()` is needed so spaces-only text fails. Also a recommendation for `strictObject`, and the point that `exits` needs a position and a target room. The review suggested extracting reusable schemas (`positionSchema`, `roomIdSchema`).
  - Second review: object shorthand (`{ positionSchema }` creates a field *named* `positionSchema`), found by reading the inferred type.
  - Third review: `roomIdSchema` still wrapped the string rule in an object, so `id` became `{ id: string }`. When I was confused, Claude Code showed the before and after and explained that a small schema should describe the value itself, and the field name belongs in the object that uses it.
- **Outcome:** ✏️
- **Why:** I wrote the schema and made the fixes, apart from seeing the `roomIdSchema` fix written out. A useful habit: hover over the inferred type to check the schema's shape.
- **How I verified it:** Hovered over `Room` in VS Code. Typecheck passes.

#### 2026-10-15 — Phase B order and the `Grid` type

- **Tool:** Claude Code
- **Category:** Planning
- **What I asked:** Whether to write tests or `tiled-schema.ts` next, and whether to import `Grid` from `movement.ts` or define a new grid type.
- **What I got:**
  - Write the tests right after each file, and split Phase B into three small PRs: the room schema, the Tiled schema with `buildWalkableGrid`, and `loadRoom`.
  - Import `Grid`, because `buildWalkableGrid` must produce exactly what `movePlayer` accepts. `src/rooms/` may import from `src/game/`, but not the other way round.
  - The room schema has no grid at all, since the grid comes from the Tiled map.
- **Outcome:** ✅
- **Why:** Smaller PRs are easier to review, and one `Grid` type can't drift apart.
- **How I verified it:** Checked against architecture rule 1 in `CLAUDE.md`.

#### 2026-10-15 — Room schema tests

- **Tool:** Claude Code
- **Category:** Review / Coding
- **What I asked:** Feedback on my unfinished test file, then help writing the first test so I could see how it's done.
- **What I got:**
  - Feedback: my test (`expect(validRoom).toBeDefined()`) never called the schema, so it would always pass. The `: Room` annotation is a TypeScript check, not a Zod check. The unused `grid` fixture broke typecheck.
  - The first real test, written by Claude Code: `roomSchema.safeParse(validRoom)` and `expect(result.success).toBe(true)`, with `validRoom` moved to the top of the file and comments explaining each line. Claude Code also showed the test can fail by changing the id on purpose.
  - Tips for the failing tests: copy `validRoom` and break one thing, then check the error `path` so each test fails for the intended reason.
- **Outcome:** ✏️
- **Why:** I'll write the remaining tests myself, following the first one. I had also added an `'exit'` tile type to `movement.ts`. Claude Code pointed out that exits would then be defined in two places (the room file and the grid). I reverted it. My underlying idea, that exits should be checked against the map, was right. It belongs in `loadRoom`, which has both the room and the grid.
- **How I verified it:** The test passes with the valid room and fails with a bad id. Typecheck, lint and Prettier pass.

#### 2026-10-16 — Room schema tests, round two

- **Tool:** Claude Code
- **Category:** Review / Coding / Learning
- **What I asked:** A review of my failing-case tests, why my earlier 3×3 grid fixture was wrong, and help writing the `expect` that checks which field failed.
- **What I got:**
  - Review: the missing-field and bad-id tests were correct. The "start inside a wall" test failed because Zod only sees the room file and has no idea where the walls are. That check belongs in the `loadRoom` tests. Also fixed: trailing spaces (Prettier) and a sprint checklist copied into the test file.
  - The 3×3 grid was in the wrong place, not a bad idea. It is a fake Tiled map (flat `data` array, `walls` layer), so it goes in the `tiled-schema` / `buildWalkableGrid` tests in the next PR. Claude Code gave hints but didn't write it.
  - Claude Code wrote the bad-id assertion `expect(result.error?.issues[0]?.path).toEqual(['id'])` and explained each part (`?.`, `issues[0]`, why `path` is an array, `toEqual` vs `toBe`). I wrote the same check for the missing-field test myself (`['name']`).
- **Outcome:** ✏️
- **Why:** I removed the wall test from the schema tests, to add it again in `loadRoom`. I kept the `path` assertion and reused the pattern myself.
- **How I verified it:** All tests, typecheck, lint and Prettier pass. Claude Code broke each test on purpose (wrong field in the fixture) and both failed with `Expected "id"/"name", Received ...`, so they check the intended rule.

#### 2026-10-16 — Learning Tiled and the Tiled schema

- **Tool:** Claude Code
- **Category:** Learning / Review / Coding
- **What I asked:** A getting-started checklist for Tiled and `tiled-schema.ts`, feedback on my exported practice map, several reviews of the schema and tests, my object-layer decision, and in the end help placing the length check.
- **What I got:**
  - Learning: a checklist for a 3×3 practice map (orthogonal, CSV layer format, fixed size, embedded tileset, layers named `floor` and `walls`). `.tmj` is Tiled's default extension for JSON maps. The review of my export caught that the layer order drew walls under the floor and that the tileset name didn't match the manifest (`dungeon`).
  - Review: `{ ...validMap }` is a shallow copy, so my tests changed the shared `layers` array. A later test then failed because of an earlier test's `-1`, not the object layer it was meant to test. My object-layer fixture also had `data: []`, so it could fail on length instead of type. Fixed with `structuredClone`, named layer constants, a realistic object layer, and a `path` assertion in every test.
  - Learning: `z.object` strips unknown fields, which is what a Tiled export needs (`strictObject` would reject every real file). `\/` in the copied fixture caused `no-useless-escape`, since JSON may escape slashes but JavaScript doesn't need it.
  - Object layers: I decided to reject them. Claude Code agreed (validate only what's used, fail loudly, it helps catch agent mistakes in Sprint 3) and suggested doing it on purpose with `type: z.literal('tilelayer')`. Before that, the test only passed because object layers have no `data`.
  - Coding: Claude Code's first `.refine` sketch had a comment as the function body, which is a syntax error, and that was why my attempt failed. Claude Code then placed a working `.refine`, and later replaced it with `.superRefine` so the error points at the exact layer (`['layers', i, 'data']`). It also wrote the schema's explanatory comment, the "accepts a flipped tile ID" test, and tidied test names and comment placement.
- **Outcome:** ✏️
- **Why:** I wrote the fixture, the tests and the field rules, and made the object-layer decision. The length check (`.superRefine`) and the final cleanups were written by Claude Code at my request so I could ship the PR. Heads-up for Phase E: the schema strips fields Phaser's tilemap loader needs, so I'll have to decide what data Phaser gets.
- **How I verified it:** All 22 tests, typecheck, lint and Prettier pass. Claude Code removed each rule on purpose (the length check, the `tilelayer` literal) and added a `.max()`. Each time, exactly the matching test failed (the object-layer test with `expected ['layers', 2, 'data'] to deeply equal ['layers', 2, 'type']`), so each test checks the intended rule.

#### 2026-10-16 — Phase B steps 3–4 guide and buildGrid tests

- **Tool:** Claude Code
- **Category:** Planning, Learning, Review, Coding
- **What I asked:** Whether to work on `buildWalkableGrid` and `loadRoom` in parallel, and for a guide to get started. Then several reviews of my first tests in `build-grid.test.ts`, help with a type error, and at the end of the day for Claude Code to make the remaining test changes because I was short on time.
- **What I got:**
  - Planning: do them one after the other in the same branch, because `loadRoom` needs the grid. A guide with decisions to make first: return my `Grid` type (`'floor' | 'wall'`) instead of the plan's `boolean[][]`, what happens without a `walls` layer, throw vs result union, and keeping `loadRoom` pure (fetching belongs to Phase E).
  - Review: my first expected values were tile IDs (the layers drawn on top of each other, which is Phaser's job), not floor/wall. After I changed them, I was passing the expected grid *into* `buildGrid`. Claude Code broke down input (map with numbers) vs output (grid with words) step by step. Later reviews found missing commas between rows (valid JavaScript, read as an index lookup), an unused import, and `layers[0]` being "possibly undefined" (`noUncheckedIndexedAccess`).
  - Learning: Claude Code showed the spread pattern (`{ ...validMap, layers: [{ ...floorLayer, data }] }`) instead of changing a deep copy, and explained that the `row` "implicitly any" error came from `buildGrid` not existing yet, not from the test.
  - Review: a 3×3 map can't catch a width/height mix-up or a wrong index formula (`y * height + x`), and all fixtures had `floor` before `walls`, so a function reading `layers[1]` would pass.
  - Coding: Claude Code made the last changes at my request: removed the pasted guide comments, renamed the flipped tile test and explained `2147483714`, added a "finds the walls layer by name" test, and replaced the length checks with a full `toEqual` on a 4×2 map with a wall in the corner. I wrote the other tests, the shared fixture file (`testing-map.ts` with `newMap()`), and decided that a missing `walls` layer means all floor.
- **Outcome:** ✏️
- **Why:** The guide and reviews kept me on track, but I needed the input/output breakdown before the tests made sense. The last test changes were written by Claude Code, not me, so I need to read them before writing `buildGrid`.
- **How I verified it:** Claude Code ran the checks after its changes: Prettier and ESLint pass, the `tiled-schema` tests still pass after moving the fixture, and all 5 `buildGrid` tests fail with "not a function", as expected before the function exists (TDD red). Typecheck only reports the missing `buildGrid` export.

#### 2026-10-17 — Final review of buildGrid

- **Tool:** Claude Code
- **Category:** Review
- **What I asked:** A last look over `build-grid.ts` and `build-grid.test.ts` after I finished them.
- **What I got:** No changes needed. `buildGrid` finds both layers by name, throws if `floor` is missing, treats a missing `walls` layer as all floor, and turns a tile that is empty in both layers into a wall. The tests now run every fixture through `tiledSchema.parse` first, so `buildGrid` gets the same typed data it will get in `loadRoom`. Two new tests cover the empty-tile case and the missing floor layer. Small things to think about, not bugs: two layers with the same name would silently use the first one (the schema doesn't stop that), and the missing-floor check could live in the schema instead of `buildGrid`.
- **Outcome:** ✅
- **Why:** I wrote `buildGrid`, the two new tests and the `tiledSchema.parse` change myself. The review confirmed it was ready, so I kept it as it was.
- **How I verified it:** Claude Code ran the checks: all 7 `buildGrid` tests pass (TDD green, after they all failed yesterday), 29 tests in total, and typecheck, ESLint and Prettier pass.

## Sprint 2 (Oct 19–25): Reference room, core gameplay

#### 2026-10-19 — Re-planning after Sprint 1 ran over

- **Tool:** Claude Code
- **Category:** Planning
- **What I asked:** Help making the Sprint 2 plan, with Sprint 1 running behind (I was on Phase B step 4), and updating the Sprint 1 plan.
- **What I got:** An estimate of what was left from Sprint 1 (about 3–4 days), a proposal to finish Sprint 1 first, then add the live-region log and the lantern visibility rules, and move combat, dice, action menus and lantern rendering to Sprint 3. It also suggested what to show at the Oct 21 supervision, and pointed out the knock-on effects on Sprint 3. Claude Code then wrote `docs/sprint-2-plan.md`, a "Status at end of sprint" section in the Sprint 1 plan, a "Plan changes" section in the project plan, and updated "Current status" in `CLAUDE.md`.
- **Outcome:** ✏️
- **Why:** The first proposal planned work on Saturday and Sunday. I said weekends should be left out of planning, since I rarely have time then, so the dice and lantern rendering moved to Sprint 3 and became a stretch list. I chose to keep the submitted sprint plan unchanged and add a "Plan changes" section instead. I went with the recommendation of lantern before combat.
- **How I verified it:** Compared against the MoSCoW and sprint plan in `docs/project-plan.md`, and my open reminders for Phase B and E.

#### 2026-10-19 — loadRoom tests: reviews and cleanup

- **Tool:** Claude Code
- **Category:** Review / Coding
- **What I asked:** Two reviews of my `load-room.test.ts`, whether `checkPositions` should get its own file, and finally for Claude Code to fix the remaining problems so I could move on to writing the function due to being behind and needing to move on.
- **What I got:**
  - Review 1: my tests called `loadRoom(grid, start, exits)`, which only checks positions, while the plan says `loadRoom` validates both files. Claude Code suggested splitting out a position helper (`checkPositions`) so my tests could stay, and pointed out missing cases: the off-by-one edge, more than one exit, and asserting what `loadRoom` returns.
  - Review 2: `checkPositions` was called three different ways (one position, an array of exits, three arguments). My `roomData` didn't match the room schema (`startPosition` instead of `playerStart`, the whole map instead of its name). Two `loadRoom` tests did `loadRoom`'s job inside the test, one never called `loadRoom`, the multiple-exits test asserted the opposite of its name, and `y: 4` missed the edge (height 3, so `y: 3`). Recommendation: keep `checkPositions` in `load-room.ts`, in its own `describe` block.
  - Coding: Claude Code rewrote `load-room.test.ts` with the signatures `checkPositions(grid, room)` and `loadRoom(roomData, mapData)` returning `{ room, grid }`. It uses a hand-written expected grid, copies of `validRoom` with one field changed, a "checks every exit" test, edge tests at `x: 3` and `y: 3`, and `toThrow(ZodError)` for a bad room file. It also changed `validRoom` in `testing-map.ts` so its start and exits are on floor tiles in `validMap` (before, both were on walls), and moved the fixture comment there from `room-schema.test.ts`.
- **Outcome:** ✏️
- **Why:** I moved `validRoom` to `testing-map.ts`, renamed the fields, fixed the edge test name and switched to `checkPositions(grid, room)` myself. The final test file was written by Claude Code at my request, so I need to read it before writing the functions. The two-argument `loadRoom` was Claude Code's suggestion, which I accepted.
- **How I verified it:** Claude Code ran the checks: Prettier and ESLint pass, the 29 existing tests still pass after changing `validRoom`, and all 10 `loadRoom` tests fail with "not a function" (TDD red). Typecheck only reports the two missing exports.

#### 2026-10-19 — loadRoom and checkPositions: reviews

- **Tool:** Claude Code
- **Category:** Review / Learning
- **What I asked:** Three reviews of `load-room.ts` while I wrote it, help with a "possibly undefined" error I couldn't fix, and a final check before shipping.
- **What I got:**
  - Review 1: `checkPositions` was correct (all 6 tests green), and checking "inside the grid" before "is a wall" is the right order. But my `loadRoom(grid, room)` only took already-validated data, while the tests give it the two raw JSON files. Claude Code listed the steps (parse both, build the grid, check positions, return), suggested `unknown` parameters and a written return type, and explained "parse, don't validate". Also: two `noUncheckedIndexedAccess` errors, use the existing `Position` type, a clearer name than `isPositionValid`, and Prettier.
  - Review 2: `loadRoom` now parsed both files, but returned `map` instead of `grid`. My return type made typecheck catch it right away. For the error I was stuck on, Claude Code explained that TypeScript only narrows the variable you check: `position.y < grid.length` doesn't prove that `positionY` exists. It showed the fix (`const row = grid[position.y]`, then `row !== undefined && …`), and pointed out that `grid?.` in `isWall` wasn't needed.
  - Final check: everything passes. Two tiny leftovers, not blockers: `position.x >= 0` is written twice in `isInsideGrid`, and `isWall` still writes `{ x: number; y: number }` instead of `Position`.
- **Outcome:** ✏️
- **Why:** I wrote both functions and made all the fixes myself. The `row !== undefined` line follows the pattern Claude Code showed me, because I couldn't solve that error on my own. I kept the type annotations on `room`, `map` and `grid` as documentation.
- **How I verified it:** Claude Code ran all 39 tests, typecheck, lint and Prettier, and all pass. It also broke the code on purpose on a backup copy: `x <= width`, checking only the first exit, and `loadRoom` skipping `checkPositions` each made exactly the matching test fail. Removing `row !== undefined` didn't fail a test, because the extra `y` checks still guard at runtime, but typecheck rejects it. The file was restored afterwards and all tests pass.

#### 2026-10-19 — Getting started with Zustand (Phase C)

- **Tool:** Claude Code
- **Category:** Learning
- **What I asked:** Help getting started with Phase C, since I haven't used Zustand before.
- **What I got:** An explanation of a vanilla Zustand store (`getState`, `setState`, `subscribe` returning an unsubscribe function, `getInitialState`), checked against the installed version (5.0.15). It used an example from another domain (a thermostat store) to show `createStore<State>()(...)`, `set` only merging the top level, immutable updates (`[...log, entry]`, never `push`), and a factory function so every test gets a fresh store. It also gave me a list of questions to decide before writing the store: name clashes with `movePlayer` and `loadRoom`, what the store's `loadRoom` receives, that the plan's state list is missing the grid, what happens before a room is loaded, how to make log ids, whether loading a room should produce a log entry (rule 5), and how to make `describeMove` exhaustive. Plus a list of store tests to write. Claude Code added the Zustand concepts to my learning notes.
- **Outcome:** ✅
- **Why:** It gave me concepts and questions instead of the store code, so I can still write Phase C myself. I started with `narration.ts`, as suggested.
- **How I verified it:** Claude Code checked the API against the type definitions in `node_modules/zustand/vanilla.d.ts`. The store questions are still open until I write `game-store.ts`.

#### 2026-10-19 — describeMove: reviews

- **Tool:** Claude Code
- **Category:** Review / Learning
- **What I asked:** Three reviews of `narration.ts` and `narration.test.ts` while I wrote them, help with a `Record` lookup I knew was wrong, and a check that I updated `movement.ts` correctly.
- **What I got:**
  - Review 1: both tests and typecheck failed. My `describeMove` loaded the test room from `testing-map.ts`, made the move itself and compared positions. Claude Code explained that it should only turn an existing `MoveResult` into text, and the store calls `movePlayer` first. Importing test fixtures and `rooms/` into `game/` also reversed the dependency direction. Also: `result: string` threw away `moved`/`reason`, `parseDirection` returned its own input, wall and edge got the same message, and the messages were wordy for a screen reader. My tests passed sentences where a `Direction` was expected, and Vitest ran them anyway because it doesn't check types.
  - Review 2: the function now took a `MoveResult`, but my `Record` listed only the keys (`{ 'wall', 'edge' }`), so nothing parsed. Claude Code explained `Record<Keys, Value>` as a lookup table with a traffic-light example, and gave three ways to get the `'wall' | 'edge'` type. It tested in a temporary file that `MoveResult['reason']` gives an error and that a missing entry is a type error. It recommended exporting a named type from `movement.ts`. Also: the copied comment, the name `REASON_OFFSETS`, a missing edge test, and the "Reason:" label.
  - Review 3: `movement.ts` was correct (`BlockedReason` exported and used in `MoveResult`). Two tests failed because the template added a period after a sentence that already ended with one ("path.."). The tests were right and the function was wrong.
- **Outcome:** ✏️
- **Why:** I wrote all the code and fixes myself. I chose the `BlockedReason` option for the type. For the double period, I removed the periods from the table sentences instead of from the template. I dropped "Reason:" and renamed the table `BLOCKED_TEXT`. The first test is still called "describes a move from one room to another", which I can rename later.
- **How I verified it:** Claude Code ran the tests, typecheck, lint and Prettier after each review. After my last fixes, all 42 tests, typecheck, lint and Prettier pass.

#### 2026-10-19 — Claude Code setup check (/doctor)

- **Tool:** Claude Code
- **Category:** Documentation
- **What I asked:** A health check of my Claude Code setup with `/doctor`.
- **What I got:** A report saying the install was up to date and healthy. It suggested turning off an unused design plugin and four unused claude.ai connectors, and cutting the "Commands" and "Proposed folder structure" sections from `CLAUDE.md`, since Claude can read those from `package.json` and the folders. It also suggested moving the PR-description instructions into a skill that only loads when needed, and making auto mode my default permission mode.
- **Outcome:** ✏️
- **Why:** I only accepted cutting the folder structure, moving the PR-description format into `.claude/skills/pr-description/SKILL.md` (Claude Code wrote it, and `CLAUDE.md` now points to it), and making auto mode my default. I kept the Commands section, the plugin and the connectors.
- **How I verified it:** Reviewed the `CLAUDE.md` change in `git diff`.

#### 2026-10-20 — game-store.ts: hints, reviews and final fixes

- **Tool:** Claude Code
- **Category:** Review, Coding
- **What I asked:** Hints on how to start the store, then four reviews of `game-store.ts`. At the end I asked Claude Code to fix the mistakes I was missing. Then two reviews of `game-store.test.ts` and a check before opening the PR.
- **What I got:**
  - Hints: write the `GameState` type first, decide what "nothing loaded yet" looks like, let the store's `loadRoom` take raw JSON and call my `rooms/loadRoom`, use one `get()` → call `game/` → one `set()` pattern per action, log ids (counter vs `randomUUID`, not `log.length`), a factory plus one shared instance, and a list of store tests.
  - Review 1: the basic pattern was right, but there was no log (rule 5), no factory, and fake starting values (`{ x: 0, y: 0 }`, `grid: []`) that would make a move before loading narrate "the edge of the world". Also: store the whole `room`, reuse `Position` and `Direction`.
  - Review 2: my factory had the store inside the parameter list instead of a function body, and I read `describeMove.result`, which doesn't exist. Claude Code explained that the starting values run once and that a function's return value has to be saved by the caller.
  - Review 3: `loadRoom` was right. A leftover comma after `return` was a syntax error that hid all other errors. Claude Code removed it in a backup-and-restore check to find the three errors underneath: `log: []` as a type means "always empty", `set` got two objects (the second argument is the `replace` flag), and `null` was on `x`/`y` instead of the whole field.
  - Review 4: I chose to do the `null` change right away instead of Claude Code's suggestion to get green first. It explained narrowing with an early return and said the `room` placeholder should become `null` too.
  - Final fixes (Claude Code wrote these): `grid: Grid | null` starting as `null`, the early return in `movePlayer`, the curried `createStore<GameState>()(...)`, the exported `gameStore` instance, comments, and Prettier. It also removed two lines I'd added at the top of the factory (`if (loadRoomFromFiles === null) return`), which checked the imported functions instead of the state, and made the function's return type include `undefined`.
  - Test review 1: all 6 tests passed, but Claude Code broke the store on purpose to check them. "Always move east" was only caught by the wall test, and a wrong log text wasn't caught at all, because I used `not.toEqual` and only checked `log.length`. It suggested exact positions, checking the log text, checking that store 2 is empty directly, and a test for invalid data.
  - Test review 2: a TS error on line 50 was two mistakes in one object: the expected position was read from the store (`Position | null`) and `reason` was missing, which showed up as "undefined" in the failing test. Also a typo (`state1` instead of `state2`), and `toThrow()` instead of `toThrow(ZodError)`.
- **Outcome:** ✏️
- **Why:** I wrote the store, the factory, the log entries in both actions and the `null` types myself. Claude Code wrote the last store fixes when I asked, so I need to be able to explain the early return and why the guards I added were wrong. I wrote all the tests and the test fixes myself, except the exact `grid` check in the `loadRoom` test, which Claude Code added when I asked. I chose to call `describeMove` in the tests for the expected text instead of writing out the sentences.
- **How I verified it:** Typecheck, lint, Prettier, all 49 tests and the build pass. Claude Code reran the broken versions on a backup (always move east, wrong log text, no grid saved, no early return): each one now makes at least one store test fail. The file was restored afterwards.

#### 2026-10-20 — Phase D: room design (decor, exits, ladders) and exit tiles cleanup

- **Tool:** Claude Code
- **Category:** Planning, Review, Coding
- **What I asked:** What Claude Code thought of a decor layer that blocks the player and names the object ("a barrel blocks your path"). Then how exits should work, since I want the player to interact with doors instead of stepping onto them, whether exits can cover several tiles, and whether ladders in the floor fit the same structure. Finally, to clean up my changes for multi-tile exits. I knew my neighbour test was wrong but not how to fix it.
- **What I got:**
  - Map check of `first-room.tmj`: the layer is called `floors` but `buildGrid` looks for `floor`, eight floor-detail tiles are on the `walls` layer (so they block), and the tileset image path points outside the repo (Phase E).
  - Decor: agreed it helps screen reader users (rule 5). Three options for where the name comes from (tile properties in Tiled, an object layer, or the room JSON). It recommended tile properties, and suggested treating decor as `'wall'` now and adding names in Sprint 3 with lantern narration.
  - Exits: at first Claude Code said the door on the `walls` layer was a problem, because exits had to be walkable. After my idea of interacting with doors, it agreed that was better and flipped the rule: exit tiles must be blocked and have a walkable neighbour. It advised against a modal "Leave or stay?" dialog. Ladders follow the same rules, so no refactor is needed.
  - It suggested the error text "Exit tile must be a door or wall tile". I pointed out I only want doors, not walls. Claude Code explained that the grid only knows `floor`/`wall`, so "door only" can't be checked until tiles have properties, and changed the text to "Exit tile must be on a blocked tile (a door or ladder)".
  - Cleanup (Claude Code wrote these): moved `isInsideGrid` and `isWall` back out of `checkPositions` (a lost `}` had nested them), removed a duplicate `position.x >= 0`, renamed the error messages, moved `validRoom`'s exits onto the top wall row (they were on floor tiles, which made 8 tests fail), fixed the "checks every exit" test, added a "checks every tile in an exit" test and a schema test for `tiles: []`.
  - My neighbour test: in the shared grid every wall touches the floor, so no tile could fail the rule, and `playerStart` doesn't decide what's walkable (the grid does). Claude Code rewrote it with its own grid where the exit tile is surrounded by walls, and moved `playerStart` to a floor tile so the start check doesn't throw first.
  - Review of my two extra neighbor tests: "expects an exit tile to have at least one walkable neighbour" passed but tested the same thing as the first test (validRoom already has an exit at (0, 0)). "Fails when the only walkable neighbor is outside the grid" used a ragged row (`['floor', 'floor']`), which `tiledSchema` no longer allows, so it tested a case that can't happen. Claude Code replaced them with a shared `enclosedGrid` (one test with the exit in the middle of walls, one on the edge, where `!isWall(neighbor)` would wrongly count the outside as walkable) and an `it.each` test with one row per direction. It also changed "neighbour" to "neighbor" to match the American spelling in the code.
- **Outcome:** ✏️
- **Why:** Interacting with exits instead of stepping onto them was my idea, and so were multi-tile exits and ladders. I wrote the `tiles` schema change, the loop over tiles, exporting `DIRECTION_OFFSETS` and the first version of the tests. Claude Code wrote the cleanup and the rewritten neighbour test. I tried to write the neighbor check myself but didn't get it working, so I asked Claude Code to write it (`hasWalkableNeighbor` and `isFloor`). I need to be able to explain why it checks for `'floor'` instead of `!isWall`.
- **How I verified it:** Typecheck, lint, Prettier and the build pass, and all 57 tests pass. Before the check was written, Claude Code tried three versions of it on a backup: a correct one passes everything, `!isWall(neighbor)` fails only the edge test, and "only look south" fails the north, east and west rows. The file was restored afterwards.

#### 2026-10-20 — Entrance hall room file and a test for all room files

- **Tool:** Claude Code
- **Category:** Learning, Review, Coding
- **What I asked:** Help with a Tiled error ("Unrecognized file format") when moving the tileset image into the repo, how to write the room file, a check of my room file, and how to test the real room files. I asked Claude Code to write that test, and asked whether it would fail because the exit's `to` room (`dingy-basement`) doesn't exist yet, and whether I should copy the room as a placeholder.
- **What I got:**
  - Tiled: the error comes from opening the PNG with File → Open. The image is changed in the tileset's Image property. Claude Code also corrected itself: earlier it said the tileset path outside the repo would break Phaser, but Phaser loads the image by key from the manifest. The path only matters for opening the map in Tiled.
  - Room file: a table of the fields and what to decide (a game-world id instead of `first-room`, `map` as a name instead of a path, the start on the carpet). Tips for the description: say the door's direction ("in the north wall"), keep it short since it's read in full, and "hall" vs "halls". It found that my file would fail Prettier in CI.
  - The test: at first Claude Code suggested `readFileSync`, but that doesn't typecheck in `src/`, because `tsconfig.app.json` has no Node types. It switched to Vite's `import.meta.glob` (with `?raw` for `.tmj`) after trying it in a temporary test. `room-files.test.ts` (written by Claude Code) finds every room in `public/rooms/`, checks that the file name matches the id, that the map file exists, and that `loadRoom` passes. A separate test checks that at least one room was found, because `it.each` with an empty list passes with zero tests.
  - The test doesn't check `to`, so it passes now. Claude Code advised against a placeholder room (CLAUDE.md says no new rooms before Sprint 3) and added the `to` check to my open reminders instead.
- **Outcome:** ✏️
- **Why:** I wrote the room file, picked the names (`entrance-hall`, `dingy-basement`) and the description, and renamed the map. Claude Code wrote `room-files.test.ts`. I still need to decide on the description changes.
- **How I verified it:** Claude Code broke my room file on purpose on a backup: wrong id, missing map, start in a wall, exit with no walkable neighbor, missing name, and an empty `public/rooms/`. Each one failed the test with a clear message. Restoring after the empty-folder check went wrong at first (a copy of the room ended up in `public/rooms/rooms-moved/`), but Claude Code compared both copies with the backup and removed the extra folder. Typecheck, lint, Prettier and all 59 tests pass.

#### 2026-10-21 — Phase E start: what data Phaser gets, and validated map in the store

- **Tool:** Claude Code
- **Category:** Planning, Learning, Review
- **What I asked:** How to start Phase E and in what order. Then how to make the tileset name a key in `TILESETS`, why my return value "needed a type", and reviews of my changes to `tiled-schema.ts`, `loadRoom`, the store and the tests. I also asked what the yellow arrow next to two test files in Vitest meant.
- **What I got:**
  - An order for Phase E split into three small PRs (data path, rendering, keyboard and log), with pitfalls: StrictMode loading the room twice, the hero sprite being 16×32, unsubscribing on `DESTROY` as well as `SHUTDOWN`, and setting `input: { keyboard: false }` so Phaser doesn't listen on `window`. It flagged `role="application"` and screen reader arrow keys as an accessibility question to decide together, not now.
  - Two options for the open reminder about Phaser's data: (A) give Phaser the raw Tiled JSON after it passes validation, or (B) validate `tilesets` too and build the tilemap from validated data. Claude Code recommended B. I chose B.
  - Hints instead of code: `z.enum` with the object's keys and a cast, because `Object.keys` is typed `string[]`; and why `.refine` would leave the type as `string`.
  - Reviews that found bugs in my code, each proven with a temporary test that was deleted afterwards:
    - I had added `name: 'dungeon'` to `TILESETS` in the manifest. That made `"name"` a valid tileset name.
    - I saved `mapData as TiledMap` in the store. That stored the raw, unvalidated map, and the `as` hid the type error that pointed at the bug.
    - My first tests used `toContain` on an object, and then `toHaveProperty` at the top level. The `image` check passed even with the bug, because `image` is inside the tileset.
  - The return value error was object shorthand: `{ tiledMap }` needs a variable named `tiledMap`. Mine was called `map`, and `tiledMap: map` is key: value, not a type.
  - The yellow arrow: Claude Code read Vitest's source and found that a yellow ❯ means a file is still running (red ❯ means failed). It couldn't reproduce what I saw, so this is likely but not confirmed.
- **Outcome:** ✏️
- **Why:** I wrote all the code and tests: the `tilesets` schema with `.min(1)`, `tiledMap` in `loadRoom` and the store, and the new tests. Claude Code didn't change my code. It gave hints and reviews, ticked off the plans, and wrote my learning notes and this entry. I fixed each bug it found myself.
- **How I verified it:** Typecheck, lint, Prettier and all 63 tests pass. Claude Code put the `mapData as TiledMap` bug back for a moment in both `loadRoom` and the store: the `tilesets.0.image` test failed both times, then my files were restored.

#### 2026-10-21 — PR 1b: `fetchRoomFiles` and its tests

- **Tool:** Claude Code
- **Category:** Planning, Learning, Review
- **What I asked:** A guide to starting PR 1b, why Phaser might need the load error, where to put the fetch file, and reviews of `fetch-room-files.ts` and its tests. I said I felt lost after the first review and asked for a step-by-step breakdown. I also asked why two tests kept failing.
- **What I got:**
  - A guide with three decisions for me to make. I chose: read the map name from the room file (A), keep the load status in `useState` (B), and put the fetching in `src/rooms/fetch-room-files.ts`, tested with Vitest and a fake `fetch` (C). Pitfalls: `fetch` doesn't reject on a 404, StrictMode runs effects twice, and live regions must be in the DOM before their text changes.
  - Why Phaser might need the error: not for this PR. But if Phaser's own loader fails in PR 2 (e.g. the tileset image is missing), the store is where it could report that to React.
  - Review of my first version: I had put `useEffect` with the `ignore` flag inside the fetch function. Claude Code ran a hook outside a component and showed that it crashes ("Invalid hook call"). Lint didn't catch it, because the hooks rule only checks components and `use…` functions. My map URL used `roomId` instead of `room.map`, which only worked because both are `entrance-hall`.
  - When I was lost: a breakdown into small steps, with an analogy (fetching a user, then their avatar) instead of my code. Later reviews found that my rewrite still used nested `.then`, and that the return type had gone missing, which made `mapData` `any`.
  - Review of `RoomLoader.tsx`: it wasn't rendered in `App.tsx` yet, and Prettier failed.
  - **Claude Code was wrong:** it had said a missing file gives a 404 that my `ok` check catches. When my page showed the error (a typo, `entrance-halls`), it asked my dev server and found that Vite answers a missing file with 200 and `index.html`, so `.json()` throws "Unexpected token '<'" without the URL. I asked Claude Code to implement the fix it recommended: a `fetchJson` helper that rethrows JSON errors with the URL, plus two tests.
  - VoiceOver test: in Safari the error in my `role="alert"` was readable but not announced, and I had to navigate to it. Claude Code explained the likely cause (live region changes during page load get dropped) and gave options: move focus to the error, put `RoomLoader` before the canvas, a `setTimeout` delay (advised against), or accept it. I moved `RoomLoader` up myself, and it still wasn't announced. Then I asked Claude Code to implement moving focus to the error (`useRef`, `tabIndex={-1}`, `.focus()` in an effect). With both focus and `role="alert"`, VoiceOver read the message twice. Claude Code had flagged that as a risk, said the first reading was the live region, and recommended removing `role="alert"`. I agreed and asked it to make the change. **That explanation was wrong:** it still read twice, now with "group, main". Claude Code said it didn't know the cause and suggested a test instead of guessing again: comment out `.focus()`. VoiceOver then read the page from the top on its own, including the error. So the first reading was VoiceOver's automatic page reading, not my code.
  - Decision: Claude Code recommended keeping the focus move and accepting the double reading as a known issue, because the automatic reading depends on timing (on a slow connection the error may appear after VoiceOver has passed it) and on a setting users can turn off. I agreed. Claude Code updated the comment in `RoomLoader` to explain it.
  - An explanation of `vi.stubGlobal` and `rejects.toThrow`, with an analogy test. My failing tests were incomplete test data, not a broken function: first a fake room missing required fields, then `exits` as an object instead of a list, then `tiles` as an object. Claude Code showed me how to read Zod's `path` (`exits`, `0`, `tiles`) to find the field.
- **Outcome:** ✏️
- **Why:** I wrote `fetch-room-files.ts`, its first four tests and `RoomLoader.tsx` myself, based on Claude Code's analogies, and fixed each review point myself. At my request, Claude Code wrote the `fetchJson` helper (moving my `ok` checks into it), the two "not JSON" tests, and the focus-on-error code in `RoomLoader`. It also wrote my learning notes and this entry.
- **How I verified it:** Typecheck, lint, Prettier and all 67 tests pass. Claude Code put four bugs into my function one at a time: map URL from `roomId`, no room `ok` check, no map `ok` check, no validation. At least one test failed for each, and my file was restored unchanged afterwards (checked with `diff`). After the `fetchJson` change: 69 tests pass, and removing the `await` in `return await response.json()` made both new tests fail. Manual checks in the dev server: with a typo in the room id (`entrance-halls`) the error showed on the page, and with the typo fixed it went away. VoiceOver in Safari: first the error wasn't announced at all; after the focus change it was read every time, twice (known issue, see above). With `playerStart` moved into a wall, the room didn't load, the error showed, and the console said the start position is inside a wall. With a temporary `console.log` of the store's log after `loadRoom`, the console showed one array with one entry (the room description), so StrictMode's second effect run didn't load the room twice.

#### 2026-10-23 — PR 2 start: the room scene, decisions, and `room-files.test.ts`

- **Tool:** Claude Code
- **Category:** Planning, Learning
- **What I asked:** How to get started on PR 2 in Phase E (the room scene draws the tilemap and the player, and follows the store), and whether `room-files.test.ts` is a leftover that should be removed.
- **What I got:**
  - `room-files.test.ts` is not a leftover. It checks the real files in `public/` (from Phase D), while `fetch-room-files.test.ts` (PR 1b) tests the fetch function with fake data. They test different things, and the test passes. Claude Code suggested keeping it.
  - A guide for PR 2 with decisions for me to make (how the scene waits for the room, where the GID conversion lives, what to do with flipped tiles, a still frame instead of an idle animation), steps in order, and pitfalls (hero sprite is 16×32, unsubscribing on `SHUTDOWN` and `DESTROY`, Phaser's loader warns instead of throwing). Claude Code checked the tilemap methods it suggested (`createBlankLayer`, `putTilesAt`, `addTilesetImage`) in the installed Phaser 4 source first.
  - I said I had never worked with this tech and asked for a more detailed breakdown of the first two steps, and told Claude Code to go with its recommendations for the decisions. It picked drawing flipped tiles unflipped instead of rejecting them, because my schema already has an "accepts a flipped tile ID" test. The breakdown has a worked example and a test list for `toTileIndices`, and for the scene an example scene for a different asset (a title logo) instead of my code.
  - Review of my `toTileIndices` and its five tests. My tests caught all four bugs Claude Code put into a copy of my function one at a time: a hardcoded `- 1`, no 0 check, no mask, and x and y swapped. Without the 0 check, only the `firstgid: 10` test failed, because with `firstgid: 1` an empty cell gives 0 − 1 = −1 by coincidence. Review points: Prettier fails on both files; the copy of `data` isn't needed, because the function only reads it and `readonly` already stops changes; the "Step 1/2/3" comments came from the guide and say *what*, not *why*; the error branch for bad data has no test; and checking for 0 after the mask is a little safer.
  - Second review: I fixed Prettier, removed the copy, rewrote the comments and added two error tests. Both new tests failed, and in both cases the expectation was wrong, not the function. `[1, 2, 3]` with width 2 has a value at index 2, so the missing one is index 3. Empty data gives height 0, so the loop never runs and the function returns `[]` instead of throwing. Claude Code suggested fixing the index and making the empty test expect `[]`. It also found a comment that still said `copy[index]`.
  - My empty-data test still failed after the rename, because it used `toThrow([])` inside an arrow function, which still means "must throw". Claude Code explained the two shapes of `expect` (return value vs error).
  - I committed step 1 and asked for a more detailed breakdown of step 2 (the scene skeleton). Before writing it, Claude Code read Phaser 4's source and found that **it had been wrong:** it had said a wrong frame name shows a placeholder box. Phaser actually warns and draws the atlas's first frame, which for my atlas is `hero-girl-0`, so the typo looks correct on screen.
  - Step 2 review: nothing showed because `create()` held a tilemap block from a Phaser 3-style pattern (`make.tilemap({ key })`, raw Tiled JSON, which is option A) with names that don't exist in my project, so it threw before the image line. After I removed it, a green box showed: the texture key was `'sprites'` instead of `'dungeon'`.
  - A breakdown of step 3 (drawing the tilemap), split into 3a (draw if the room is already loaded) and 3b (subscribe for when it isn't, with cleanup). Claude Code read Phaser's `Tileset.setImage` to check that an atlas texture works as a tileset image (it does, because the atlas's `__BASE` frame covers the whole sheet). It recommended swapping `image` for `texture: 'dungeon'` in `TILESETS`, so the scene doesn't depend on the tileset name and texture key being the same by coincidence.
- **Outcome:** ✏️
- **Why:** Planning and review. Claude Code didn't change my code. The four decisions are Claude Code's recommendations, which I accepted without changing them. I wrote `tile-indices.ts` and `tile-indices.test.ts` myself, and made all the review fixes myself.
- **How I verified it:** Claude Code ran `room-files.test.ts` and it passed. For `toTileIndices`: all 5 tests pass, typecheck and lint are clean, Prettier fails. Claude Code put four bugs into my function one at a time, and at least one test failed for each. My file was restored unchanged afterwards (checked with `diff`).

#### 2026-10-26 — Manifest: tileset texture and its test

- **Tool:** Claude Code
- **Category:** Review, Coding
- **What I asked:** I changed `TILESETS` to name its `texture` instead of an `image` path (Claude Code's recommendation for step 3), and tried to extend `manifest.test.ts` to cover tilesets. I knew it wasn't right and asked Claude Code to check it and correct it.
- **What I got:**
  - My loop checked tileset *frame names*, but a tileset has none: Phaser cuts the whole image into a grid. The loop also used `Object.entries` on an array, which gives the indexes (`"0"`, `"1"`…) as names, so the test failed for every frame, and typecheck failed on the unused `frameData`.
  - Claude Code replaced the loop with a new test, "cuts every tileset image into whole tiles": the atlas image size (`meta.size`) must divide evenly by `tileWidth` and `tileHeight`. It also added a `TilesetDefinition` type with `satisfies` in the manifest, so a `texture` that isn't in `TEXTURES` is a type error, the same way `SPRITES` already works.
  - I asked for a more detailed breakdown of step 3a.2 (inside `drawRoom`). Claude Code first pointed out that my `drawRoom` had no closing brace, so `create()` was inside it. Then it gave an outline with four commented steps and the real values from my map.
  - Review of my `drawRoom`: the TypeScript error on line 46 was the missing `null` check after `addTilesetImage`, which the breakdown had asked for. The other error ("`drawRoom` is never read") goes away once `create()` calls it in 3a.3. Prettier failed on indentation. The rest was correct.
  - Step 3a: I threw an error when the store had no map yet. Claude Code explained that "not loaded yet" is a normal state, not a bug, and that a `throw` would stop `create()` before the subscription in 3b. I changed it to `if`/`else`.
  - A breakdown of 3b: subscribe for when the map arrives later (compare `state.tiledMap` with `previousState.tiledMap`), and unsubscribe on `SHUTDOWN` and `DESTROY`.
  - **Claude Code was wrong:** it said that commenting out the unsubscribe lines would probably give errors in dev because of StrictMode. I got no errors. The likely reason is that StrictMode destroys the first game straight away, before it has loaded anything, so its `create()` never runs and it never subscribes. The cleanup is still needed for scenes that end after `create()` (Vite hot reload now, and later leaving the game page or changing rooms). Claude Code suggested another check: log in the listener, trigger a hot reload, and count how many times it logs.
  - That check also showed only one line. Claude Code hadn't mentioned that Vite's `[vite] hot updated` messages are `console.debug`, which the browser hides by default (it checked Vite's client code). With Verbose turned on, my console showed `hot updated` followed by `Navigated to http://localhost:5173/`: a full page reload, which throws away the old scene, so one line was correct. Because hot reload turned out to be unreliable for this, Claude Code suggested a check that doesn't depend on it: put the game on `window` for a moment and restart the scene with `game.scene.start('room')`. It checked in Phaser's source that this shuts the running scene down (`SHUTDOWN`) and runs `create()` again.
  - Result: without the cleanup lines, "listener ran" logged twice after one restart; with them, once. At my request, Claude Code then removed the temporary debug code (the `window` lines in `main.tsx` and `PhaserGame.tsx`, and the `console.log` in the listener).
- **Outcome:** ✏️
- **Why:** I made the manifest change and the first version of the test. At my request, Claude Code wrote the replacement test and the `TilesetDefinition` type. It also wrote my learning notes and this entry.
- **How I verified it:** The cleanup check above: two listener calls without the unsubscribe lines, one with them. After the debug code was removed, all 77 tests pass and typecheck, lint and Prettier are clean. For the manifest test, Claude Code changed `tileWidth` to 15 for a moment and the new test failed with "dungeon: 1024×1024 image, 15×16 tiles"; with the texture misspelled `dungeonn`, typecheck failed. The manifest was restored afterwards.

#### 2026-10-26 — Phaser: the player sprite follows the store

- **Tool:** Claude Code
- **Category:** Planning, Learning, Review, Coding
- **What I asked:** Help me break down step 4 of Phase E (keyboard input). Claude Code found that I hadn't drawn the player sprite yet (step 3), so I went back and asked for a detailed outline of step 3, then a closer breakdown of 3b (create the sprite), then help when I got stuck on each part.
- **What I got:**
  - A breakdown of step 4 (key-to-direction function, focusable region, `onKeyDown`, the log as an `<ol>`), which I haven't started. It noticed that `room-scene.ts` had no sprite, which is why I went back to step 3.
  - An outline of step 3 and a more detailed 3b: look the sprite up through `SPRITES` (not hard-coded names), a sprite's origin is its centre but a tile's is its top-left corner, and the player has to be drawn in two places (in `create()` and in the subscriber).
  - My `drawPlayer` had an invalid parameter (`tiledMap.tilewidth: TiledMap['tilewidth']`, a property path can't be a parameter name). Claude Code **rewrote the function** to take `tileSize: number`. It also deleted my `if (!hero) throw` check, because `PLAYER_SPRITE` is a fixed key of `SPRITES`, so TypeScript already knows it exists.
  - The hero didn't appear. Claude Code diagnosed it (it read `RoomLoader.tsx` to confirm): `create()` runs before the room has loaded, so the store is still empty, and my subscriber drew the room but never the player. I added the missing `drawPlayer` call myself.
  - The temporary `window.gameStore` line for testing in the console: Claude Code explained why `Object.assign(window, { gameStore })` and `import.meta.env.DEV` (no `any`, and it can't reach production). I added it to `main.tsx` myself.
  - The sprite still didn't move. Claude Code **found the bug:** my "move the sprite" code was nested inside the "`tiledMap` changed" check, which is never true again after the room has loaded. It **rewrote the subscriber** into two separate checks and **added the `tileSize` class field** (set in `drawRoom`) that I asked for, and removed the `tileSize` parameter from `drawPlayer` and `tileToPixel`.
  - Two notes in `docs/learning-notes.md` (Phaser): sprite origin, and `create()` running before the room has loaded.
- **Outcome:** ✏️
- **Why:** I wrote `drawPlayer`, `tileToPixel`, the subscriber changes and the `main.tsx` line. Claude Code rewrote `drawPlayer`'s signature, and wrote the final subscriber and the class field, in the second fix. I kept both. Claude Code's first step-4 breakdown assumed the sprite existed; I hadn't checked that it was there until it was pointed out.
- **How I verified it:** Typecheck and lint pass (Claude Code ran them after the second fix). In the browser: the hero stands on the start tile, and `gameStore.getState().movePlayer('east')` in the console moves it one tile, with a new log entry each time. I have not yet checked walking into a wall, or that only one sprite exists after a reload.

#### 2026-10-27 — Keyboard input, focusable game region and adventure log

- **Tool:** Claude Code
- **Category:** Planning, Review, Coding, Accessibility
- **What I asked:** Breakdowns of the rest of Phase E (step 4: key mapping, focusable game region, `onKeyDown`, the log as an `<ol>`), then help with each problem I hit, and a review of everything before the PR.
- **What I got:**
  - Breakdowns for 4a to 4e, with a checklist for manual testing. I wrote `keyToDirection` and its tests, the `PhaserGame` changes, the CSS and `AdventureLog` myself. Claude Code suggested a `Tab` test case and a comment on why unmapped keys return `undefined` (so `Tab` isn't trapped).
  - **Claude Code was wrong:** it said `role="application"` would satisfy the `jsx-a11y/no-noninteractive-tabindex` lint rule. It doesn't. After I still got the error, Claude Code read the plugin's source and added an exception for the role in `eslint.config.js`. It then said the `onKeyDown` rule could be fixed "the same way", which was wrong again: that rule's exceptions are keyed by element type, not role. It wrote a second exception limited to `src/ui/PhaserGame.tsx` instead, and tested with throwaway snippets that an `onClick` there and an `onKeyDown` in another file still fail.
  - My CSS had two typos (`#phase-game`, and a space in `#phaser-game: focus-visible`), which made the page-wide default focus ring show. Claude Code found them. I later switched to `:focus`, so the outline also shows after a mouse click.
  - VoiceOver didn't read my `aria-describedby` hint in Chrome or Safari, even though the dev tools Accessibility tab showed the Description correctly. Claude Code's advice was to put the hint in `aria-label`, which fixed it. VoiceOver's own "you are currently on an application…" text comes from the role, not from my code.
  - Review of `handleKeyDown`: `event.repeat` was after `movePlayer`, so it did nothing; a redundant `if (direction)`; a pasted comment from Claude Code in the file. I fixed all three.
  - Clicking the canvas didn't focus it. Claude Code found in Phaser's source that its mouse manager calls `preventDefault()` on `mousedown` (`preventDefaultDown` defaults to `true`), which blocks focus. I set `input: { mouse: false }` myself, since the game uses no Phaser mouse input.
  - The hero stopped one row early at the top wall. The cause was the 16×32 sprite frame: with the default centred origin its feet were half a tile too low. **Claude Code had told me to check the frame size and never followed up.** It wrote `setOrigin(0.5, 1)` and `tileToSpritePosition` in `room-scene.ts`, and changed it again when I wanted the feet in the centre of the tile.
  - VoiceOver didn't announce moves. Expected: the `log` array was never rendered, so there was no text in the DOM. The live region comes in Phase F.
  - Diagonal movement: pressing two arrows together is two separate one-tile steps with two log entries, each checked against the grid. Claude Code's advice was to leave true diagonal movement and movement per turn (my idea of 30 ft = 3 tiles) for Sprint 3 and write them in the sprint plan, which it did. It also noted that 30 ft is 6 tiles at D&D's 5 ft per square.
  - Notes for `docs/learning-notes.md` (Accessibility, Phaser, reminders) and the Sprint 2 plan (turn structure and diagonal ideas).
- **Outcome:** ✏️
- **Why:** I kept the breakdowns and the lint exceptions, and changed my code after each review point. I rejected nothing, but I corrected Claude Code's two wrong lint claims by testing, and the VoiceOver result showed that `aria-describedby` can't be relied on for essential information.
- **How I verified it:** Claude Code ran typecheck, lint, Prettier, all 82 tests and the build before the PR: all pass. By hand: arrows move the hero one tile with a log entry each (also into walls), holding a key doesn't repeat, the page doesn't scroll, Tab leaves the region, clicking the canvas focuses it, and VoiceOver reads the name, role and hint. Not yet tested: announcements of moves (Phase F).

#### 2026-10-27 — Review, commits and PR descriptions for the room scene and the release

- **Tool:** Claude Code
- **Category:** Review, Documentation
- **What I asked:** A last check of the branch, the commits in order with messages, the PR description for the room scene (#17), and the description for the release from `dev` to `main` (#18).
- **What I got:**
  - Typecheck, lint, Prettier, all 82 tests and the build run, and a list of small review points (a missing comment on `mouse: false`, heading case, an unused id), which I fixed.
  - Seven commits, split so each one passes lint on its own (the ESLint exception before the handler that needs it), with the commits already on the branch left out.
  - The two PR descriptions, in the format of my earlier PRs. Claude Code looked at the merged PRs and `git log origin/main..origin/dev` to list everything the release included (#4 to #17), and told me not to claim two manual checks (click focus, held key) until I'd run them.
  - A VoiceOver and keyboard question about `fn` + arrow and Cmd/Option + arrow scrolling the page. Claude Code's explanation: those are browser shortcuts that my handler leaves alone on purpose, and the scroll shortcuts only seemed to start once the page was tall enough to scroll. I tested and agreed.
  - Ticked Phase E and the release boxes in `CLAUDE.md` and `docs/sprint-2-plan.md`.
- **Outcome:** ✅
- **Why:** The descriptions and commit messages are what I merged, with edits to the manual-check lines so they only list what I ran. I did the merges and the commits myself.
- **How I verified it:** CI on both PRs, and the manual checks listed in each description. Claude Code could not see the deployed site, so the checks on `lantern-wine.vercel.app` after the release were mine.

#### 2026-10-27 — Phase F: adventure log as a live region

- **Tool:** Claude Code
- **Category:** Planning, Review, Accessibility
- **What I asked:** A breakdown of Phase F, a name for the branch, and a review of my change to `AdventureLog.tsx`.
- **What I got:**
  - Breakdown: Claude Code read the plan and my code first and found that the heading, `aria-labelledby`, the `key={entry.id}` and the empty-list-before-the-first-message were already done in Phase E. Only `role="log"` was missing.
  - Decision: `role="log"` directly on the `<ol>` (option A) replaces the list semantics, so Claude Code gave me two options and recommended B, a `<div role="log">` around the `<ol>`.
  - Branch name: `feature/adventure-log-live-region`, matching `feature/room-scene`.
  - Review: my change was correct. Claude Code said I should not add `aria-live` myself (`role="log"` already means `polite`, and implies `aria-atomic="false"`, so only new entries are read). It flagged that keeping `aria-labelledby` on both the div and the `<ol>` might make VoiceOver say "Adventure log" twice, and left that for me to test. It also warned that the first "You enter the room" entry might not be announced during page load.
- **Outcome:** ✏️
- **Why:** I chose B and wrote the change myself. Claude Code's "might read twice" was a guess, so I tested it. VoiceOver did read the name twice, so I removed `aria-labelledby` from the `<ol>`. The div is the named region and the `<ol>` is just the list.
- **How I verified it:** VoiceOver: walking into a wall or the edge twice announces the message both times. Not yet checked (Claude Code listed them): that old entries aren't read again when a new one is added, that focus stays on the game region, and whether the first entry is announced on load.

---

## Agent-built rooms: evaluation

Filled in from Sprint 3 onwards. One row per agent-built room, compared with the hand-built reference room.

| Room | Agent / model | PR | Passed checks on first try? (schema, tests, axe) | Corrections needed | Accessibility issues found | Time spent reviewing | Estimated time to build by hand |
| ---- | ------------- | -- | ------------------------------------------------ | ------------------ | -------------------------- | -------------------- | ------------------------------- |
|      |               |    |                                                  |                    |                            |                      |                                 |

**Notes per room:**

<!-- What went wrong, what the agent misunderstood in the spec, what I changed in CLAUDE.md as a result. -->

---

## Summary for the final report

Filled in during Sprint 5.

- **Where AI helped most:**
  - Oct 14: Keeping me in scope and within license requirements (the tavern pack is CC BY-SA, not CC0, and the tavern is a Could item)
- **Where AI was wrong or misleading:** (e.g. confident claims that testing disproved)
  - Oct 13: Copilot's false claim about subpath imports in the lint rule
  - Oct 13: Copilot's false claim that an empty grid throws
  - Oct 13: Claude Code's contradictory explanation of auto-deleting branches, and outdated Vercel instructions
  - Oct 16: Claude Code's `.refine` sketch wasn't valid code (a comment as the function body)
- **How I verified AI output:**
- **Agent workflow results:** reference room vs agent-built rooms
- **What I would do differently:**
