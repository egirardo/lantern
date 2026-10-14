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
- **How I verified AI output:**
- **Agent workflow results:** reference room vs agent-built rooms
- **What I would do differently:**
