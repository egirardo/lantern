# CLAUDE.md

This file gives Claude context for working on **Lantern**. Read it at the start of every session.

## About the project

Lantern is a turn-based pixel-art dungeon crawler for the browser, inspired by tabletop RPGs like Dungeons & Dragons. The player explores a dark dungeon where only the area lit by their lantern is visible, fights monsters with dice-based combat, and follows the adventure through a narrated log.

The core goal is **accessibility**: the game must be fully playable with keyboard only and with a screen reader. Players can save their accessibility settings and progress to an account so they follow them across devices.

This is my examensarbete (thesis project) in the web development program at Yrgo. It runs for six weeks, Oct 12 – Nov 22, with submission before **Nov 16**. The full project plan is in `docs/project-plan.md`.

## How to work with me

- **I need to understand all code in this project.** I will present and defend it. Explain your reasoning, prefer clear code over clever code, and point out when something is a pattern or concept I should learn.
- **Plan before coding.** For anything beyond a small change, propose a plan first and wait for my OK.
- **Keep changes small.** One feature or fix at a time, so each change is easy to review.
- **Ask before** adding dependencies, changing the architecture, or deviating from this file.
- **Stay in scope.** Follow the MoSCoW priorities in `docs/project-plan.md`. If you have an idea outside the current sprint, mention it instead of building it.
- **Never weaken accessibility** to make something easier to build. If an accessibility requirement is hard to meet, say so and we'll decide together.
- **Keep my AI log up to date.** Add entries to `docs/ai-log.md` yourself, without waiting to be asked. See "AI log" below.
- **Keep my learning notes up to date.** See "Learning notes" below.
- **Write the PR description when I say I'm ready to ship** (or open a PR, or similar), using the `pr-description` skill. Don't add a "Generated with Claude Code" line or any other attribution line to PR descriptions.

## AI log

`docs/ai-log.md` is part of my thesis. Add an entry for each meaningful use of AI in a session, at the end of the session or when a task is finished.

Rules:

- Follow the entry template and categories at the top of the log. Put entries under the current sprint, newest at the bottom.
- Write in first person from my point of view ("What I asked"), in the same plain style as the existing entries.
- Be honest: include where you were wrong, changed your mind, or where I rejected your suggestion.
- Record who wrote what: code I wrote vs code you wrote or changed.
- **Outcome**, **Why** and **How I verified it** are my judgments. Fill them in from what happened in the session, then tell me to check them.
- Group small related requests into one entry instead of logging every message.
- Mention in your reply when you've updated the log, so I know to review it.

## Learning notes

`docs/learning-notes.md` is my personal reference for learning the tech stack. It is in `.gitignore`, so if it doesn't exist (e.g. on a new machine), create it.

Add to it when something worth remembering comes up, without waiting to be asked:

- A concept explained for the first time (e.g. a Phaser, Zustand or TypeScript pattern)
- A gotcha or error we ran into, with its cause and fix
- A decision we made, and **why**
- A reminder for later (e.g. a temporary setting to remove), under "Open reminders". Tick it off when done.

Rules:

- Put each note under the matching topic heading. Add a new heading if none fits.
- Keep notes short and in plain language. Don't copy whole explanations.
- Don't duplicate tasks from sprint plans. Notes are for understanding, not to-dos.
- Update or remove notes that become wrong (e.g. after a version upgrade).
- Mention in your reply when you've updated the notes, so I know to look.

## Tech stack

- **Phaser** + TypeScript — canvas rendering (new to me, so explain Phaser concepts as we go)
- **React** + TypeScript — accessible UI layer
- **Zustand** — shared game state used by both Phaser and React
- **Vite** — build tool
- **Supabase** — authentication and PostgreSQL database, with row-level security
- **Tiled** — map editor for rooms
- **Zod** — validation of room data files
- **Vitest** — unit tests; **Playwright** — end-to-end and keyboard tests; **axe-core** — accessibility checks
- **Vercel** — hosting, with preview deploys per pull request
- **Art** — CC0 pixel art asset pack (16×16 tiles), possibly replaced with my own Aseprite art later

## Architecture rules

These are the core decisions of the project. Do not break them without asking.

1. **Game logic is pure TypeScript.** Movement, visibility, combat and dice live in `src/game/`, with no imports from Phaser or React. All game logic must be unit testable.
2. **One source of truth.** All game state lives in the Zustand store. Phaser and React both read from and subscribe to it. Neither keeps its own copy of game state.
3. **Phaser only renders.** Phaser draws the dungeon, sprites, lantern light and animations. No game rules in Phaser code.
4. **React is the accessible layer.** The adventure log, action menus, inventory, settings and account pages are React components in the DOM.
5. **Every game event produces text.** Anything that happens visually on the canvas must also produce a log message. If it only exists on the canvas, a screen reader user can't perceive it.
6. **Rooms are data, not code.** A general room engine reads each room from a Tiled map and a JSON config file. Room files are validated with Zod. Adding a room should never require new engine code.
7. **Art is referenced by name.** Sprites are looked up through the asset manifest by logical names (e.g. `giant-rat`), never by file path in game code or room files.
8. **Saves are local-first.** Saves and settings always go to localStorage. When logged in, they also sync to Supabase, and the most recently updated version wins. Guest mode and logged-in mode use the same code path.

## Accessibility requirements

These apply to every feature. Target: **WCAG 2.2 AA**.

- Everything is playable with **keyboard only**. No mouse-only interactions.
- **Focus is always visible** and moves logically. When a menu or dialog opens, focus moves into it; when it closes, focus returns to where it was.
- Game events are announced through **ARIA live regions** in the adventure log. Use `polite` for normal events and `assertive` only for urgent ones (e.g. low health). Avoid flooding the screen reader with announcements.
- **Never convey information by color alone.**
- **Respect the player's settings:** reduced motion (also respect `prefers-reduced-motion`), high contrast, text size and log verbosity.
- Use **semantic HTML first**, and ARIA only when HTML can't do the job.
- **Login and sign-up** must meet WCAG 2.2 Accessible Authentication: allow pasting and password managers, no puzzles or memory tests.
- No time limits on turns. The game waits for the player.

## Code conventions

- TypeScript in **strict mode**. Avoid `any`.
- Files: `kebab-case.ts`; React components: `PascalCase.tsx`.
- Room ids, enemy types and item types use `kebab-case` (e.g. `flooded-cellar`, `giant-rat`).
- Write unit tests for all game logic in `src/game/`.
- Use clear, descriptive names. Comment the *why* when it isn't obvious. Comments explaining *what* the code does are welcome too, since I'm learning the stack. Don't flag them in reviews, and add similar ones to code you write.

## Commands

*Fill in once the project is set up.*

```
npm run dev         # start dev server
npm run build       # production build
npm run test        # unit tests (Vitest)
npm run test:e2e    # Playwright tests
npm run lint        # ESLint
npm run typecheck   # TypeScript check
```

## Current status

**Sprint 2 (Oct 19–25): Reference room, core gameplay**
Goal: the player moves around the reference room on the deployed site, every move is announced in the adventure log, and the lantern visibility rules are written and tested. Full plan: `docs/sprint-2-plan.md`.

Sprint 1 ran over, so this sprint first finishes it:

- [x] Phase B step 4: `loadRoom`
- [x] Phase C: narration and store
- [x] Phase D: the reference room in Tiled
- [ ] Phase E: Phaser rendering and keyboard input
- [ ] Deployed to `dev` and released to `main`

Then the new Sprint 2 work:

- [ ] Phase F: adventure log as an ARIA live region (Must)
- [ ] Phase G: lantern visibility rules, logic and tests only (Must)
- **Supervision Oct 21**

Moved to Sprint 3: lantern rendering and narration, dice, combat, action menus. Sprints are planned on weekdays only.

*Update this section at the start of each sprint.*

## Building rooms (for agents)

*To be written in Sprint 3, once the reference room is finished.* This section will describe the room data format, narration tone, and the checklist every agent-built room must pass. Until then, do not create new rooms.