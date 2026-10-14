# Lantern

A turn-based pixel-art dungeon crawler for the browser, inspired by tabletop RPGs. Explore a dark dungeon by lantern light, fight monsters with dice-based combat and follow the adventure through a narrated log.

Lantern is built to be fully playable with keyboard only and with a screen reader.

> **Status:** in development. This is a thesis project (examensarbete) in the web development program at Yrgo, autumn 2026.

## Tech stack

Phaser, React, TypeScript, Zustand, Vite, Supabase, Tiled and Zod.

## Getting started

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev
```

## Scripts

| Command                | What it does                         |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the dev server                 |
| `npm run build`        | Production build                     |
| `npm test`             | Run unit tests once                  |
| `npm run test:watch`   | Run unit tests on every save         |
| `npm run lint`         | Lint with ESLint                     |
| `npm run typecheck`    | Type-check with TypeScript           |
| `npm run format`       | Format code with Prettier            |
| `npm run format:check` | Check formatting without changing it |

## License

Code: see [LICENSE](LICENSE).

## Asset credits

- **[DungeonTileset II Extended](https://nijikokun.itch.io/dungeontileset-ii-extended)** by nijikokun, an extension of **[DungeonTileset II](https://0x72.itch.io/dungeontileset-ii)** by 0x72. Licensed [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Used for the dungeon tiles and characters.
