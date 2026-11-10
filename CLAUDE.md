# CLAUDE.md

This file gives Claude context for working on **Lantern**. Read it at the start of every session.

The rules for all coding agents (use Graphify before grep) are in `AGENTS.md`, imported here so Claude Code reads them too:

@AGENTS.md

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

**Sprint 4 (Nov 2–8), planned together with Sprint 5 up to submission on Fri Nov 13**
Goal: finish the reference room, start the agents on rooms 2 and 3, then settings, saves, accounts and the evaluations. Full plan and timeline: `docs/sprint-4-plan.md`.

Sprints 1–3 are finished (Phases H and I done; J, K and L moved here). Decided Nov 2: the dungeon has **3 rooms**, all Shoulds wait until after submission, and Playwright and axe-core are reduced to one axe scan (plus one keyboard Playwright path if there's time). Thu Nov 5 is a morning only; Sun Nov 8 is a full working day.

- [ ] Phase J: keyboard action menus and focus management (Tue Nov 3)
- [ ] Phase K: lantern rendering and narration of what the light reveals (Wed Nov 4 – Thu Nov 5)
- [ ] Exits and room changes, arriving at the doorway (Fri Nov 6)
- [ ] "Building rooms" spec below, agents build rooms 2 and 3 (from Sun Nov 8)
- [ ] Phase L: accessibility settings (Sun Nov 8 – Mon Nov 9)
- [ ] Guest saves, Supabase accounts, sync and row-level security (Tue Nov 10 – Wed Nov 11)
- [ ] Full screen reader pass, axe scan, WCAG and agent evaluations, submission (Thu Nov 12 – Fri Nov 13)

**Code freeze Nov 16 (heard Nov 4):** no code can be pushed after that. Submission stays Fri Nov 13; Sprint 6 is gone.

**Goal of the game (decision 8, Nov 4):** find the key in one room to unlock the final exit in another. A simple inventory is back; health potions looted from barrels and crates are the first stretch item (go or no-go Wed Nov 11). The UI skin is cut.

Work split (decision 7 in `docs/sprint-4-plan.md`, Nov 4): for pure helpers in `src/game/`, I write the tests and Claude writes the implementation and explains it. **Agents** build Phaser rendering (Phase K steps 5–6), the Supabase foundation, exits and room changes (with the item format and a locked exit), items and inventory, and guest saves with sync, each as a PR from its own worktree that I review. I write the settings dialog and focus code, the login form, and do all VoiceOver testing myself.

*Update this section at the start of each sprint.*

## Building rooms (for agents)

You build rooms as **data only**: a room file and a map file per room. The room engine already handles everything else (architecture rule 6). The reference room is the entrance hall (`public/rooms/entrance-hall.json` and `public/maps/entrance-hall.tmj`): when this section doesn't answer something, do what the entrance hall does. If a room can't be built without changing code, stop and say so in the PR instead of changing it.

### What you may change

- **Add:** `public/rooms/<room-id>.json` and `public/maps/<room-id>.tmj` for the rooms in your prompt. Nothing else.
- **Don't touch:** anything in `src/` (engine, schemas, tests), `enemies.json`, `items.json`, `tile-names.json`, the asset manifest and `sprites.json`, the entrance hall files, `docs/` (the AI log and sprint plans are mine; I log your work during review), and any other room.
- Don't add enemy types, item types or decor names. Use only the ones that exist. If a room design needs a new one, stop and ask.

### The rooms

The designs are approved and are in `docs/sprint-4-plan.md`, "Agent spec and agent rooms", point 5. Follow them exactly, including the descriptions word for word. Ask if a design conflicts with this spec.

| Room id | Name | Exits (where, leads to) |
| --- | --- | --- |
| `dingy-basement` | The Dingy Basement | stairs up in the top-left corner at (0, 2) → `entrance-hall`; ladder down in the south-west corner → `forgotten-vault`; doorway (mat) in the east wall → `old-crypt` |
| `forgotten-vault` | The Forgotten Vault | ladder up in the north wall at (5, 2) → `dingy-basement` (the only exit) |
| `old-crypt` | The Old Crypt | way back: a carpet leading out of the south edge at (5–6, 9) → `dingy-basement`; great door in the north wall, `"final": true`, `"requires": "gold-key"` |

### The room file (`public/rooms/<room-id>.json`)

Validated by `src/rooms/room-schema.ts` (Zod, strict: unknown fields fail). Copy the entrance hall's shape.

- `id`: kebab-case, the same as the file name. `name`: "The …". `map`: the map's file name without `.tmj` (use the room id).
- Coordinates are tiles, `x` 0–11 from the left, `y` 0–9 from the top.
- `playerStart`: a free floor tile. It's only used at the start of a new game or as a fallback, but it must be valid.
- `exits`: see "Exits" below.
- `enemies`: `{ "id", "type", "position" }`. `type` is a key in `src/game/enemies.json` (`skeleton`, `demon`, `orc`, `mimic`). `id` is the type plus a number (`skeleton-1`, `skeleton-2`), unique in the room. Enemies stand on free floor tiles, never on `playerStart`, on another enemy or on the tile where the player arrives from another room.
- `items`: always present. Write `"items": []` when the room has none (all three rooms have none; the key is carried by the mimic).

### The map file (`public/maps/<room-id>.tmj`)

- **Start from a copy of `entrance-hall.tmj`** and change only the three `data` arrays. Keep everything else as it is, above all the `tilesets` block: one embedded tileset named `dungeon`, `firstgid` 1, image `../assets/dungeon/dungeontileset-extended.png`. (In Tiled itself: Preferences → General → Export Options → Embed tilesets, then export as `.tmj` to `public/maps/`.)
- **12×10 tiles**, 16×16 pixels. The canvas has a fixed size, so no other size works. A smaller room is a 12×10 map with empty cells (see the vault).
- **Three tile layers, in this order:** `floor` → `decor` → `walls`. Each `data` array has 120 numbers, row by row from the top-left; `0` means no tile. No object layers.
- **What blocks:** a cell with a tile on `walls` is blocked. A cell with only `floor` and/or `decor` is walkable. A cell with no tile on any layer is blocked and drawn black (useful for the vault).
- **No flipped or rotated tiles.** Every number is a plain tile id.
- **Tile ids:** the `.tmj` uses gids, which are the tileset's local id + 1 (because `firstgid` is 1). `tile-names.json` uses **local** ids. So the crate is `1426` in `tile-names.json` and `1427` in the map.

### Tiles

Use only tiles that appear in `entrance-hall.tmj` or in this table (all numbers are gids, for the map):

| What | Gids | Layer | Notes |
| --- | --- | --- | --- |
| Plain floor, cracked floor | 258; 259, 260, 322, 323, 324, 386, 387 | floor | as in the entrance hall |
| North wall | 66, 67, 68 (and the wall details 132, 195, 196, 450 from the hall) | walls, with a wall tile on floor under transparent pieces | the top two rows, like the hall |
| Door, north wall only | 912 913 over 976 977 | walls | the hall's door; the exit tiles are the bottom row (976, 977) |
| Doorway mat, east or west wall | red 1284 over 1348, or beige 1287 over 1351 | walls | one wide, two tall, on the edge column (x 0 or 11); both tiles are exit tiles |
| Carpet way out, south edge | 1154 1155 at y 9 (exit tiles), with the carpet top 1090 1091 on floor at y 8 in front | walls (y 9), floor (y 8) | the carpet seems to go on out of the room; list the left tile first, so the player arrives on the carpet top |
| Stairs up | 393 | walls, floor (258) under it | one tile, on the floor row right under the north wall, so the back is against the wall and the bottom rests on the floor. Steps go down to the east, so it belongs in the top-left corner. It's the exit tile. Not the two-way stairs 264 265 / 328 329 |
| Ladder (up, against a wall) | 392 | walls, a wall tile on floor under it | |
| Ladder down (hatch in the floor) | 388 | walls | stands alone on the floor. Not the fountain: `"388"` in `tile-names.json` is a local id (gid 389) |
| Rug, red or beige (optional) | 1282 1283 over 1410 1411, or 1285 1286 over 1413 1414 | decor | 2×2, walk-over, unnamed; not an exit |
| Named decor | `tile-names.json` ids + 1 | walls | see below |

**Named decor** (the five names in `tile-names.json`: pillar, crate, empty-chest, candlestick, fountain):

- Only tiles listed in `tile-names.json` get a name, and the game announces them when the lantern reveals them ("A crate appears to the east"). Never add names.
- A named tile always goes on the **walls** layer, so it blocks. On another layer, `loadRoom` fails the room ("Named decor … is on a walkable tile").
- Anything that is drawn in front of or behind a named piece (a pillar base, the crate lid 1363, ooze under a wall) goes on **decor**.
- **Never stack crates vertically** (found in the Nov 9 playtest). The crate tile has no top edge of its own: its lid on the cell above draws it. In a stack, that cell is the upper crate on `walls`, which hides the lid, so the lower crate looks cut off. Every crate has its lid on the cell above, except a crate right under the stairs, which get the edge from the stairs. Crates side by side in a row are fine.
- **Pillars** always stand against a wall. Multi-tile pieces (pillar, fountain, candlestick) use all their tiles, as in the sheet.
- Never draw a **closed** chest in a map: in this dungeon a closed chest is the mimic (an enemy sprite, not a tile).

### Exits

- Each exit is `{ "tiles": [...], "to": "<room-id>" }`, or `{ "tiles": [...], "final": true }` for the way out of the dungeon. `"requires": "<item type>"` locks it.
- **Exit tiles are blocked tiles** (on `walls`): the door, stairs, ladder or doorway mat tiles the player walks into. Each must have a walkable tile next to it.
- **Every exit has an exit back** in the room it leads to (`to` the first room). Not checked by the tests, so check it yourself across rooms.
- **Where the player arrives:** coming from another room, the player stands on the first free floor tile next to the exit back, trying the exit's tiles in the order listed and, for each, **north, south, east, west**. Make sure that tile is the one in front of the door:
  - North-wall door, or stairs under the north wall: works by itself (north of it is wall, south is floor).
  - **East or west doorway mat:** list the top mat tile first, and make the tile directly **above** the mat blocked. Otherwise the player arrives beside the mat, not in front of it. Easiest: put the mat right under the north wall (exit tiles at y 2 and 3, with the wall at y 1 above).
  - Ladder down in the floor: the first free tile north of it, then south, east, west.
  - No enemy on the arrival tile (a guard stands on another tile next to the exit).
- **What an exit looks like:** the sheet has no side-view doors, so **doors only go in the north wall**, where they can be seen. An exit in the east or west wall is a **doorway mat** on the edge column (from the table), which looks like a runner leading out through a gap in the wall. Stairs and ladders show what they are. The mat has no name on purpose: the exit reveal line already says where the exit is.

### The mimic (vault only)

- `mimic-1`, type `mimic`, at (6, 5), with `"carries": "gold-key"`. The disguise ("chest") is already in `enemies.json`; the room file adds nothing else.
- Don't put the key in `items`, and don't draw a chest tile under or next to the mimic.

### Narration

- The description is read aloud when the player enters, so it carries the room for a player who can't see the canvas.
- The rooms in this spec use the approved descriptions word for word. For any future room: second person and present tense, 1–3 short sentences, sound, smell and air more than looks, the same plain tone as the entrance hall.
- **It says only what the player notices on arrival without seeing far** (decided Nov 9 after playtesting): where they are, sound, smell and air, and the way they came in ("Stone steps lead back up to the entrance hall."). A sighted player only sees the lantern's circle, so a description of the whole room would tell a screen reader user more than the canvas shows.
- It does **not** mention the exits ahead, enemies, items, decor or the mimic's chest: the lantern reveals those one by one. A sound can hint at something out of sight ("Water trickles somewhere ahead.").
- Don't say anything the game doesn't do (lit candles, smells that are "dangerous", doors that can be opened when they can't).

### Checklist (every room PR)

Run and pass, with the output in the PR:

1. `npm test`: `src/rooms/room-files.test.ts` finds every room in `public/rooms/` and loads it with its map (schema, 12×10 grid, positions, exits, named decor).
2. `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.

Then check by reading the files, and say in the PR that you did:

3. The diff only adds room and map files (no `src/` changes).
4. Every exit has an exit back, the arrival tile is in front of each door, and no enemy stands on it.
5. Doors only in the north wall, doorway mats for east and west exits; named decor only on `walls`; no closed chest tiles; no flipped tiles.
6. The description matches the design word for word.
7. Open the PR against `dev` with a short description (no attribution line). I check it in the browser and with VoiceOver: keyboard only, every reveal line, every exit both ways.