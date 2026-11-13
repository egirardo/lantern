# Lantern

Lantern is a turn-based pixel-art dungeon crawler for the browser, inspired by tabletop RPGs like Dungeons & Dragons. The dungeon is dark, and you only see the area your lantern lights up. You fight monsters with dice-based combat and follow the adventure in a narrated log. You're locked in, and the goal is to find the key and the way out.

Lantern is built to be fully playable with keyboard only and with a screen reader. The target is WCAG 2.2 AA.

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

A fight starts when you step next to an enemy. Focus moves to the attack buttons in the **Actions** panel; when the fight ends, it goes back to the map. Next to an exit, Actions shows an exit button too, so you can find it by tabbing. Turns have no time limit: the game waits for you.

## The game screen

- **Map:** the dungeon on a canvas. Only the tiles in your lantern's light are drawn.
- **Adventure log:** everything that happens, as text. Under it, **Actions**: the attack buttons in a fight, the exit button next to an exit, otherwise "Nothing to do here."
- **Health, Inventory and Goal:** your health as a number (the bar is only decoration), what you carry, and your next step.
- **End card:** after a victory or a game over, with your stats and a **Play again** button.
- **Header buttons:** **How to play**, **Settings** and **Account**. Each opens a menu drawn as a book, at that page. The book has a tab for each page, so you can switch between them without closing it.

## Status

The game can be played from start to end: four rooms (the entrance hall, the dingy basement, the forgotten vault and the old crypt), the lantern light and its narration, dice combat, a mimic that carries the gold key, a locked final exit, an inventory and a goal panel, an end card with Play again, accessibility settings, saves, and accounts that sync settings and progress across devices.

Planned after submission: enemy health in the Health panel and in the log, a more detailed goal, and the Should features in the project plan, such as health potions.

## Accessibility

- **Keyboard only.** Everything is done with the keyboard. Focus moves into the attack buttons when a fight starts and back to the map when it ends; closing the menu returns focus to the button that opened it.
- **Adventure log.** Every game event is written to the log as text, so nothing only exists on the canvas. When the lantern reveals something, the log says what and in which direction. New lines are announced through an ARIA live region: polite for normal events, assertive only for low health. The log can be focused and read back.
- **Settings** (the Settings button in the header):
  - **Reduce motion** stops the animations. It starts on if your operating system asks for less motion (`prefers-reduced-motion`).
  - **High contrast** turns off the decorations and uses black and white, including a hard-edged lantern light.
  - **Text size**: Normal, Large, Larger or Largest. All the text on the page grows.
  - **Adventure log**: Verbose or Brief. Brief leaves out the lines about decor (crates, pillars…), never enemies or exits.
- **Saves and accounts.** Your settings and progress are always saved in the browser, so guests keep them too. When you're signed in, they also sync to your account, and the most recently updated version wins. Sign-in allows pasting and password managers, with no puzzles.
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
- **React** + TypeScript: the accessible UI layer (log, panels, the menu, the start screen and the account form)
- **Zustand**: the shared game state, read by both Phaser and React
- **Vite**: build tool
- **Supabase**: accounts (email and password) and a PostgreSQL database for synced saves, with row-level security
- **Tiled**: map editor for the rooms
- **Zod**: validation of the room data files
- **Vitest**: unit tests
- **Vercel**: hosting, with preview deploys per pull request

## Credits and licenses

Code: MIT, see [LICENSE](LICENSE).

- **[DungeonTileset II Extended](https://nijikokun.itch.io/dungeontileset-ii-extended)** by nijikokun, an extension of **[DungeonTileset II](https://0x72.itch.io/dungeontileset-ii)** by 0x72. License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication). Used for the dungeon tiles and characters. No attribution is required, but the authors deserve the credit.
- **[Pixel Operator](https://www.dafont.com/pixel-operator.font)** font by Jayvee Enaguas (HarvettFox96). License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Used for all text in the game. The font files and their license are in `public/assets/fonts/`.
- **[Pixel RPG UI Pack](https://immunitys.itch.io/pixel-ui-pack)** by immunitys (itch.io). The license allows editing and commercial use and asks for credit. Used for the panels, banners, the book menu, its tabs and the button icons. Only the pieces the game uses are included, some of them edited; the list is in [`public/assets/ui/CREDITS.md`](public/assets/ui/CREDITS.md).

## Project context

Lantern is my thesis project (examensarbete) in the web development program at Yrgo. The project plan, sprint plans and AI log are in [`docs/`](docs/).
