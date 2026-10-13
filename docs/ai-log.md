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
- **Why:** The ragged grid bug was real and is fixed, with regression tests. The empty grid claim was false, because `||` short-circuits before `grid[0].length`. Also turned on `noUncheckedIndexedAccess`, which flagged both risky lookups immediately.
- **How I verified it:** Ran `movePlayer` on both grids before the fix. The regression test failed before the fix and passed after.

#### 2026-10-13 — Supabase project setup

- **Tool:** Claude Code
- **Category:** Learning / Security
- **What I asked:** Which Supabase settings to choose, and whether to connect GitHub now.
- **What I got:** Advice to turn off "Automatically expose new tables" and turn on automatic RLS, to keep plain Postgres, and to wait with the GitHub integration until Sprint 4. Also `.env.example` and safer `.gitignore` rules.
- **Outcome:** ✅
- **Why:** New tables now need both a grant and RLS policies before anyone can access them.
- **How I verified it:** Checked that `.env.local` is ignored by Git.

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
- **Where AI was wrong or misleading:** (e.g. confident claims that testing disproved)
- **How I verified AI output:**
- **Agent workflow results:** reference room vs agent-built rooms
- **What I would do differently:**
