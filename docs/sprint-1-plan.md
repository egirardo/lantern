# Sprint 1 plan: Foundation (Oct 12–18)

**Goal:** a deployed project skeleton where the player can move around the first room with the keyboard.

**Who does what**

- **Elsa** runs all installs, does the dashboard setup (Vercel, Supabase), builds the room in Tiled and writes all reference room code (Phases A–E).
- **Claude** writes tooling and config (scaffold config, CI, asset manifest), explains concepts, reviews PRs and gives hints on request.

---

## Branches and environments

```
feature/* ──PR──▶ dev ──PR──▶ main
           (preview)  (pre-production)  (production)
```

- **Feature PRs** get their own Vercel preview URL, so one change can be tested on its own.
- **`dev` is pre-production.** Vercel gives the `dev` branch a stable preview address (something like `lantern-git-dev-egirardo.vercel.app`) that updates on every merge.
- **`main` is production.** You release by opening a PR from `dev` to `main`.
- **GitHub Actions** runs lint, typecheck, tests and build on PRs to both `dev` and `main`.
- **Branch protection on `main`:** nothing can be merged unless CI passes.
- **Sprint 3:** Playwright and axe-core tests run against the `dev` preview URL.
- **Sprint 4 (decide then):** a separate Supabase project for `dev` and `main`, using per-environment variables in Vercel.

---

## Setup steps

### Step 1 — Project scaffold

**You run (in the project root):**

```sh
git switch -c feature/scaffold
npm create vite@latest . -- --template react-ts
```

The folder isn't empty (it already has `CLAUDE.md`, `docs/` and `LICENSE`). When Vite asks what to do, choose **"Ignore files and continue"**. Don't choose "Remove existing files".

```sh
npm install
npm install phaser zustand zod
npm install -D vitest prettier eslint-plugin-jsx-a11y
```

The Vite template already includes `typescript`, `eslint`, `typescript-eslint` and `eslint-plugin-react-hooks`. Check `package.json` to confirm.

Optional: `npm install -D eslint-config-prettier` turns off ESLint formatting rules that would conflict with Prettier. Recommended, but your call.

**Then Claude:**

- Confirms strict mode in `tsconfig` and adds ESLint config for `jsx-a11y`
- Adds Prettier config and Vitest config
- Adds the npm scripts: `dev`, `build`, `test`, `lint`, `typecheck`
- Creates the folder structure from `CLAUDE.md`
- Adds a `PhaserGame.tsx` component that creates the Phaser game when it mounts and destroys it when it unmounts
- Pins Node to an LTS version (`.nvmrc` and `engines`)

> **Concept:** React StrictMode mounts components twice in development. If the Phaser game isn't destroyed in the effect's cleanup function, you get two canvases.

- [x] Done

### Step 2 — CI and deploys

- **Claude:** GitHub Actions workflow (lint, typecheck, test, build) on PRs to `dev` and `main`.
- **You:**
  - Connect the repo to Vercel. Production branch: `main`.
  - Turn on branch protection for `main` in GitHub settings, requiring CI to pass.

- [x] Done

### Step 3 — Supabase project

- **You:**
  - Create the project in the Supabase dashboard.
  - Put the URL and anon key in `.env.local` (never committed) and in Vercel's environment variables.
- **Claude:** `.env.example`, and checks that `.env.local` is in `.gitignore`.
- Don't install `@supabase/supabase-js` or write auth code until Sprint 4.

- [x] Done

### Step 4 — Asset pack and manifest

- **You:**
  - Choose a 16×16 CC0 pack with tiles, a player, at least 3 enemies, potions and keys.
  - Check the license on the pack's own page.
  - **Try to decide by Oct 15.** Phases D and E depend on it.
- **Claude:** `src/assets/manifest.ts`, which maps logical names (`player`, `giant-rat`, `floor`) to a file and frame. Phaser's preload step loops over the manifest. Game code never uses file paths (architecture rule 7).

- [x] Done

### Step 5 — AI log

- Add a template to `docs/ai-log.md` (date, tool, what I asked, what I kept or rejected and why) and log each session.

- [x] Done

---

## Reference room code (Elsa writes)

Write the pure logic first, test-first. It doesn't need art or Phaser, so you can start before the asset pack is chosen. Open one PR to `dev` per phase and ask Claude for a review.

The type shapes below are suggestions. Change them however you like.

### Phase A — Movement rules (`src/game/movement.ts`)

1. Define the types:
   - `Position { x, y }`
   - `Direction = 'north' | 'south' | 'east' | 'west'`
   - a walkable grid as `boolean[][]`
2. **Write the tests first:**
   - [x] Moving onto an open tile works
   - [x] A wall blocks the move
   - [x] The edge of the map blocks the move
   - [x] The input position isn't mutated
3. Return a result like `{ moved: true, position } | { moved: false, reason: 'wall' | 'edge' }`.

> **Concept: discriminated union.** TypeScript makes you handle both cases, and `reason` later becomes log text ("A wall blocks your way").

**Pitfalls**

- On screens, y grows downward, so north is `y - 1`.
- Grids are usually indexed `grid[y][x]` (row first). Mixing up x and y is the most common bug here.

- [x] Phase A done, PR reviewed

### Phase B — Room schema and Tiled parser (`src/rooms/`)

1. **`room-schema.ts`:** a Zod schema with these fields:
   - `id` (regex for kebab-case)
   - `name`
   - `map`
   - `playerStart`
   - `description`
   - `exits`
2. **`tiled-schema.ts`:** validate only the parts of Tiled's JSON you use: `width`, `height`, `tilewidth`, and `layers` with `name` and `data`.
3. **`buildWalkableGrid(map)`:** any non-zero tile in the `walls` layer means blocked.
4. **`loadRoom(...)`:** also checks that `playerStart` is inside the grid and on a walkable tile. Zod can't check this alone, because it needs both files.
5. **Tests:**
   - [x] A tiny hand-written 3×3 map fixture (will go in tiled-schema.test.ts)
   - [x] A valid room passes
   - [x] A missing field fails
   - [x] A bad id fails
   - [x] A start position inside a wall fails (will go in load-room.test.ts)

> **Concept:** `z.infer<typeof roomSchema>` derives the TypeScript type from the schema, so the type and the validation never drift apart.

**Pitfall:** Tiled stores `data` as a flat array. The tile at (x, y) is `data[y * width + x]`, and tile `0` means empty.

- [x] Phase B done, PR reviewed

### Phase C — Store and narration (`src/state/`, `src/game/narration.ts`)

1. **`narration.ts`:** a pure function `describeMove(result, direction)` that returns text, with unit tests. Narration is game logic, so it lives in `src/game/`.
2. **`game-store.ts`:** use `createStore` from `zustand/vanilla`.
   - State: `room`, `playerPosition`, `log: { id, text }[]`
   - Actions: `loadRoom`, `movePlayer(direction)`
3. **Rule of thumb:** the store calls functions from `game/` and holds no rules itself. If you write an `if` about walls in the store, move it to `game/`.
4. **Test the store with Vitest:** call an action, then check the state.

> **Concept:** a vanilla Zustand store works outside React, so Phaser can subscribe to it directly. React uses the same store through a hook.

- [ ] Phase C done, PR reviewed

### Phase D — The room in Tiled (needs the asset pack)

- Use an orthogonal map with 16×16 tiles, around 12×10 in size.
- **Embed the tileset in the map.** An external `.tsx` tileset is a separate file that Phaser won't load from your map.
- Name the layers exactly `floor` and `walls` so they match your parser.
- Export to `public/maps/<room-id>.json` and write `public/rooms/<room-id>.json`.

- [ ] Phase D done

### Phase E — Phaser rendering and keyboard input

1. **Phaser concepts to learn, in order:**
   - Game config (set `pixelArt: true` so tiles scale crisply)
   - The scene lifecycle: `preload` → `create` → `update`
   - The loader
   - Tilemaps: `make.tilemap`, `addTilesetImage`, `createLayer`
   - Sprites
2. **Validated data only:** your loader fetches and validates the map, and Phaser receives the *validated* data from the store, so it never draws an unvalidated map. Ask Claude how to hand that data to Phaser when you get here.
3. **The scene follows the store:** subscribe in `create()` and move the sprite to `x * 16`, `y * 16`.
4. **Keyboard input lives in React:**
   - Put a `keydown` handler on a focusable game region, not on `window`. A listener on `window` would also catch keys typed into the settings and login forms later.
   - Call `preventDefault()` on arrow keys so the page doesn't scroll.
5. **Log:** a plain `<ol>` of entries for now. The ARIA live region comes in Sprint 2.

**Pitfall:** unsubscribe from the store when the scene shuts down, or you get duplicate listeners and memory leaks.

- [ ] Phase E done, PR reviewed
- [ ] Deployed to `dev`, then released to `main`

---

## Timeline

| Date      | Claude                               | Elsa                                    |
| --------- | ------------------------------------ | --------------------------------------- |
| Oct 13–14 | Step 1 config, Step 2 CI             | Step 1 installs, Phase A                |
| Oct 15    | Help with Vercel and Supabase setup  | Steps 2–3 dashboards, Phase B, choose asset pack |
| Oct 16    | Asset manifest (Step 4)              | Phase C                                 |
| Oct 17    | Reviews                              | Phases D and E                          |
| Oct 18    | AI log summary                       | Buffer, deploy check, release to `main` |

---

## Status at end of sprint (Oct 18)

The sprint goal wasn't reached. Steps 1–5 and Phase A are done, and Phase B is done up to step 3 (`buildGrid`). Learning Zod and Tiled, and getting the schema tests right, took longer than the timeline above planned for.

**Carried over to Sprint 2** (tracked in `docs/sprint-2-plan.md`):

- Phase B step 4: `loadRoom` and the "start inside a wall" test
- Phase C: narration and store
- Phase D: the reference room in Tiled
- Phase E: Phaser rendering and keyboard input
- Deploy to `dev` and release to `main`

The timeline above is kept as it was planned, as a record.

## Getting help without getting solutions

- Ask for a **hint** to get a direction, not code.
- Ask for a **review** on each PR. It's checked against the architecture rules and accessibility requirements in `CLAUDE.md`.
- Ask **"why does Phaser do X?"** at any time.
