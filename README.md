# Lantern

Lantern is a turn-based pixel-art dungeon crawler for the browser, inspired by tabletop RPGs like Dungeons & Dragons. The dungeon is dark, and you only see the area your lantern lights up. You fight monsters with dice-based combat and follow the adventure in a narrated log. You're locked in, and the goal is to find the key and the way out.

Lantern is built to be fully playable with keyboard only and with a screen reader. The target is WCAG 2.2 AA.

## How to play

| Key                     | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| Tab                     | Move focus to the map                                     |
| Arrow keys              | Move one tile (one key press is one step)                 |
| Enter                   | Use an exit next to you                                   |
| Tab, then Enter / Space | In a fight: choose an enemy in the combat menu and attack |

When you stand next to an exit, a "Use the exit" button also appears after the map, so you can find the action by tabbing. A fight starts when you step next to an enemy. Turns have no time limit: the game waits for you.

## Status

In development. Built so far: the first room, movement, the lantern light, dice combat, exits and the final exit, and the adventure log.

Planned, not built yet: rooms 2 and 3, picking up items (the key) and an inventory, accessibility settings, saves, and logging in to sync settings and progress across devices.

## Accessibility

- **Keyboard only.** Everything is done with the keyboard. Focus moves into the combat menu when a fight starts, and back to the map when it ends.
- **Adventure log.** Every game event is written to the log as text, so nothing only exists on the canvas. New lines are announced through ARIA live regions: polite for normal events, assertive only for urgent ones like low health. The log can be focused and read back.
- **Reduced motion.** Lantern follows the operating system's reduced motion setting (`prefers-reduced-motion`). A player setting comes with the accessibility settings.
- **Known issue with VoiceOver.** VoiceOver's hints talk over the announcements. VoiceOver users get the best experience with hints turned off: **VoiceOver Utility → Verbosity → Hints**.

## Getting started

Requires Node 24 (`engines` in `package.json`, and `.nvmrc`).

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` with the values from your Supabase project. `.env.example` explains each variable.

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

### Database

The Supabase tables, the row-level security policies and how to run their tests are described in [`supabase/README.md`](supabase/README.md).

## Tech stack

- **Phaser** + TypeScript: draws the dungeon, sprites and lantern light on a canvas
- **React** + TypeScript: the accessible UI layer (log, menus)
- **Zustand**: the shared game state, read by both Phaser and React
- **Vite**: build tool
- **Supabase**: authentication and PostgreSQL database, with row-level security
- **Tiled**: map editor for the rooms
- **Zod**: validation of the room data files
- **Vitest**: unit tests
- **Vercel**: hosting, with preview deploys per pull request

## Credits and licenses

Code: MIT, see [LICENSE](LICENSE).

- **[DungeonTileset II Extended](https://nijikokun.itch.io/dungeontileset-ii-extended)** by nijikokun, an extension of **[DungeonTileset II](https://0x72.itch.io/dungeontileset-ii)** by 0x72. License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication). Used for the dungeon tiles and characters. No attribution is required, but the authors deserve the credit.
- **Pixel Operator** font by Jayvee Enaguas (HarvettFox96). License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Used for all text in the game. The font files and their license are in `public/assets/fonts/`.

## Project context

Lantern is my thesis project (examensarbete) in the web development program at Yrgo, autumn 2026. The project plan, sprint plans and AI log are in [`docs/`](docs/).
