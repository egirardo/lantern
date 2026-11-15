# Lantern

Lantern is a turn-based pixel-art dungeon crawler for the browser, inspired by tabletop RPGs like Dungeons & Dragons. The dungeon is dark, and you only see what your lantern lights up. You fight monsters with dice and follow the adventure in a narrated log. You're locked in: find the key and the way out.

Lantern is built to be fully playable with the keyboard only and with a screen reader. The target is **WCAG 2.2 AA**. Everything that happens on the canvas is also written as text, so a player who can't see the map gets the same game.

## How to play

Press **Start** (or **Continue** if you have a game in progress). Focus moves to the map.

| Key                       | What it does                                           |
| ------------------------- | ------------------------------------------------------ |
| Arrow keys (map focused)  | Move one tile (one key press is one step and turn)     |
| Enter (map focused)       | Use an exit next to you                                |
| Tab                       | Move between the map, the log and the panels           |
| Enter / Space on a button | Attack an enemy, use an exit, open a menu page         |
| Escape (in the menu)      | Close the menu; focus goes back to the button          |
| Arrow keys (on a tab)     | Move between the menu's tabs (Home / End: first, last) |

- **Exploring.** Your lantern lights a small circle around you. The log tells you what comes into the light and in which direction: enemies, exits and things in the room.
- **Fighting.** A fight starts when you step next to an enemy. Focus moves to the attack buttons in the **Actions** panel, and back to the map when the fight ends. Each attack rolls a 20-sided die plus a bonus and hits if the total is at least the target's armor class (AC). The log says every roll, the damage and the health left.
- **Exits.** Next to an exit, the log tells you, and Actions shows an exit button. Going through an exit heals you to full health.
- **The goal.** The **Goal** panel shows your next step. It starts with "Explore your surroundings." and changes once you find the locked great door and the key.
- **The end.** After a victory or a game over, the log tells you to press Tab to reach **Play again**.

Turns have no time limit: the game waits for you.

## The game screen

- **Map:** the dungeon on a canvas. Only the tiles in your lantern's light are drawn.
- **Adventure log:** everything that happens, as text. You can focus it and scroll back.
- **Actions:** the attack buttons in a fight, the exit button next to an exit, otherwise "Nothing to do here."
- **Health:** your health as a number, and during a fight the health of every enemy still standing. The bars only repeat the numbers.
- **Inventory and Goal:** what you carry, and your next step.
- **End card:** after a victory or a game over, with your stats and a **Play again** button.
- **Header buttons:** **How to play**, **Settings** and **Account** open a menu drawn as a book, at that page. Its tabs switch between the pages without closing it.

## What's built

- **Four rooms** (the entrance hall, the dingy basement, the forgotten vault and the old crypt), built as data only: a Tiled map and a JSON file per room, read by one room engine. Three of them were built by AI agents from a written spec (see "How this was made").
- **The lantern light** and narration of what it reveals, room by room.
- **Dice combat** with initiative, critical hits and misses, four enemy types, and a mimic disguised as a chest that carries the gold key.
- **A locked final exit**, an inventory, and a goal that follows what the player has been told.
- **Health in the log and on screen** for the player and the enemies, with an urgent warning at low health.
- **Accessibility settings:** reduce motion, high contrast, text size and log verbosity.
- **Saves and accounts:** progress and settings are saved in the browser, and sync to an account when you sign in.

**Planned after submission:** health potions, a choice of character, visible labels on the menu's tabs, sound cues, and the other Should features in the [project plan](docs/project-plan.md).

## Accessibility

- **Keyboard only.** Everything is done with the keyboard, and focus is always visible. Focus moves into the attack buttons when a fight starts and back to the map when it ends; closing the menu returns focus to the button that opened it.
- **Every game event is text.** The adventure log writes everything that happens. New lines are announced through ARIA live regions: polite for normal events, assertive only for the low-health warning.
- **Never color alone.** Health, the goal and the inventory are said in words; colors and bars only repeat them.
- **Settings** (the Settings button):
  - **Reduce motion** stops the animations. It starts on if your operating system asks for less motion (`prefers-reduced-motion`).
  - **High contrast** turns off the decorations and uses black and white, a system font in the log, and a hard-edged lantern light.
  - **Text size:** Normal, Large, Larger or Largest. All the text on the page grows.
  - **Adventure log:** Verbose or Brief. Brief leaves out the lines about decor (crates, pillars…), never enemies or exits.
- **Accessible sign-in.** Pasting and password managers work, with no puzzles or memory tests (WCAG 2.2 Accessible Authentication).
- **Tested** with VoiceOver in Safari and Chrome, the keyboard alone, and an axe-core scan. My notes for the WCAG 2.2 AA evaluation, criterion by criterion, are in [`docs/wcag-notes.md`](docs/wcag-notes.md).

**Known issues** (all in [`docs/wcag-notes.md`](docs/wcag-notes.md)):

- VoiceOver's hints can talk over the announcements. VoiceOver users get the best experience with hints turned off: **VoiceOver Utility → Verbosity → Hints**.
- Pressing keys quickly while VoiceOver is talking skips lines. The whole log stays on the page to read back.
- The book menu's tabs and Close button are icons on screen; their names are read by screen readers and shown in high contrast.
- Chrome's VoiceOver says "clickable" after some plain text. Nothing is lost.

## Architecture

The core rules, from [`CLAUDE.md`](CLAUDE.md):

1. **Game logic is pure TypeScript** (`src/game/`): movement, visibility, combat, dice and narration, with no Phaser or React, so all of it is unit tested.
2. **One source of truth:** all game state lives in a Zustand store (`src/state/`). Phaser and React both read from it.
3. **Phaser only renders** (`src/phaser/`): the dungeon, sprites, lantern light and animations.
4. **React is the accessible layer** (`src/ui/`): the log, panels, menus, settings and the account form.
5. **Every game event produces text** in the log.
6. **Rooms are data, not code** (`public/rooms/`, `public/maps/`), validated with Zod (`src/rooms/`).
7. **Art is referenced by name** through the asset manifest (`src/assets/`).
8. **Saves are local-first** (`src/save/`): always in the browser, synced to Supabase when signed in, newest wins.

## Getting started

Requires Node 24 (`engines` in `package.json`, and `.nvmrc`).

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` with the values from your Supabase project; `.env.example` explains each variable. Without them the game still works, with guest saves only.

For screen reader testing, use a production build (`npm run build`, then `npm run preview`) or a Vercel preview, not the dev server: the dev server's extra checks and hot reload made VoiceOver behave differently.

### Scripts

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the dev server                     |
| `npm run build`        | Type-check and make a production build   |
| `npm run preview`      | Serve the production build locally       |
| `npm test`             | Run the unit tests once (Vitest)         |
| `npm run test:watch`   | Run the unit tests on every save         |
| `npm run lint`         | Lint with ESLint                         |
| `npm run typecheck`    | Type-check with TypeScript               |
| `npm run format`       | Format the code with Prettier            |
| `npm run format:check` | Check the formatting without changing it |

### Tests and CI

About 800 unit tests (Vitest) cover the game logic, the room files and the save rules. Every room file in `public/rooms/` is loaded and checked by a test. The row-level security tests need the test users in `.env.local` and are skipped without them.

GitHub Actions runs lint, typecheck, the format check, the tests and the build on every pull request to `dev` and `main`, and Vercel deploys a preview of each one.

### Database

The Supabase tables, the row-level security policies and how to run their tests are described in [`supabase/README.md`](supabase/README.md).

## Tech stack

- **Phaser** + TypeScript: draws the dungeon, sprites and lantern light on a canvas
- **React** + TypeScript: the accessible UI layer
- **Zustand**: the shared game state, read by both Phaser and React
- **Vite**: build tool
- **Supabase**: accounts (email and password) and a PostgreSQL database for synced saves, with row-level security
- **Tiled**: map editor for the rooms
- **Zod**: validation of the room files, saves and settings
- **Vitest**: unit tests
- **Vercel**: hosting, with a preview deploy per pull request

## How this was made

Lantern is my thesis project (examensarbete) in the web development program at Yrgo, built over six weeks in autumn 2026. Part of the thesis is how AI tools can be used in a project like this:

- I planned the project, wrote the reference room and the tests for the core game logic, reviewed every pull request and did all the screen reader testing myself.
- **Claude Code** helped with planning, explanations, reviews and parts of the code. **AI agents** built three of the four rooms from a written spec, and several features as pull requests from their own worktrees, which I reviewed and tested before merging.
- Every meaningful use of AI is recorded in the [AI log](docs/ai-log.md), including what I rejected and how I verified it.

The project plan, sprint plans and AI log are in [`docs/`](docs/).

## Credits and licenses

Code: MIT, see [LICENSE](LICENSE).

- **[DungeonTileset II Extended](https://nijikokun.itch.io/dungeontileset-ii-extended)** by nijikokun, an extension of **[DungeonTileset II](https://0x72.itch.io/dungeontileset-ii)** by 0x72. License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication). Used for the dungeon tiles and characters. No attribution is required, but the authors deserve the credit.
- **[Pixel Operator](https://www.dafont.com/pixel-operator.font)** font by Jayvee Enaguas (HarvettFox96). License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Used for all text in the game. The font files and their license are in `public/assets/fonts/`.
- **[Pixel RPG UI Pack](https://immunitys.itch.io/pixel-ui-pack)** by immunitys (itch.io). The license allows editing and commercial use and asks for credit. Used for the panels, banners, the book menu, its tabs and the button icons. Only the pieces the game uses are included, some of them edited; the list is in [`public/assets/ui/CREDITS.md`](public/assets/ui/CREDITS.md).
