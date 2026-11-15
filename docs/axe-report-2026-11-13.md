# axe-core scan, Nov 13 2026

One automated accessibility scan of Lantern, as planned in the sprint 4 plan (Playwright and axe-core reduced to "one axe scan"). Run by Claude Code on the `dev` branch after #53 (the dungeon UI) was merged. Nothing in the app was changed for the scan.

- **Date:** Fri Nov 13 2026, 15:30–16:10 CET
- **axe-core:** 4.10.2 (from `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js`)
- **Browser:** Google Chrome 157.0.8103.52, headless (`--headless=new`), macOS
- **App:** Vite 8.3.4 dev server (`npm run dev -- --port 5180 --strictPort`), playing as a guest, localStorage cleared before each new game. No sign-in or sign-up was sent.
- **Rule set:** `runOnly` tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`

## Result in one line

**One rule fails: `color-contrast` (serious), and every node it flags is a false positive.** The text is ink on parchment (10.00:1), but the parchment is drawn by a CSS `border-image`, which axe can't see, so axe measures the ink against the dark page behind it (1.14:1). With high contrast on (no `border-image` art), axe finds no violations at all. No critical, moderate or minor violations in any state. No sideways scroll at 320px.

## States scanned

| # | State | Size | How it was reached | Violations |
| --- | --- | --- | --- | --- |
| 01 | Start screen | 1280×800 | New page, localStorage cleared | none |
| 02 | Start screen, Sign in pressed | 1280×800 | Tab ×4 to "Sign in", Enter. Form shown, focus on the "Sign in" heading. Not submitted. | none |
| 03 | Game screen after Start | 1280×800 | Tab (Start is the first stop), Enter. Focus on `#phaser-game` ("Dungeon map"), room `entrance-hall` | color-contrast (6 nodes) |
| 04 | Menu: How to play | 1280×800 | Header "How to play", Enter. Focus on the How to play tab | color-contrast (3) |
| 05 | Menu: Settings | 1280×800 | Arrow Down on the tabs | color-contrast (3) |
| 06 | Menu: Account | 1280×800 | End on the tabs. Escape then closed the book and focus went back to "How to play" | color-contrast (1) |
| 07 | Game screen, high contrast + Largest text | 1280×800 | `updateSettings({ highContrast: true, textSize: 'largest' })`; checked `<html data-contrast="high" style="--text-scale: 2">`, root font size 32px | none |
| 08 | Menu: Settings, high contrast + Largest | 1280×800 | Header "Settings", Enter | none |
| 08b | Menu: How to play, high contrast + Largest | 1280×800 | Home on the tabs | none |
| 09 | A fight | 1280×800 | New game, Arrow Up ×5 from (5, 8) to (5, 3), next to the demon. Focus moved to "Attack the demon" | color-contrast (17) |
| 10 | Next to an exit | 1280×800 | Won the fight with Enter on the attack button (focus back on the map), Arrow Up to (5, 2). Actions shows "Use the exit to the north" | color-contrast (14) |
| 11 | End card (game over) | 1280×800 | From state 10, `gameStore.setState({ player: { ...player, currentHealth: 0 } })`. The card showed "Game over. You have fallen. Enemies defeated: 1. Health left: 0 / 12. Play again", and Actions was gone | color-contrast (18) |
| 12 | Game screen | 320×800 | New game, Tab, Enter | color-contrast (6) |
| 13 | Game screen, Largest text | 320×800 | `updateSettings({ textSize: 'largest' })` | color-contrast (6) |

**Reflow (no sideways scroll):** `document.documentElement.scrollWidth` / `innerWidth` was 320/320 at 320px (normal and Largest text) and 1280/1280 at 1280px with high contrast and Largest text.

The node count grows with the log: every log line on parchment is one node (states 09–11 have more lines).

## Summary table

| Rule | Impact | WCAG | States | Verdict |
| --- | --- | --- | --- | --- |
| `color-contrast` | serious | 1.4.3 (wcag2aa, wcag143) | 03, 04, 05, 06, 09, 10, 11, 12, 13 | **False positive** (parchment drawn by `border-image`; real ratio 10.00:1) |

No other rule failed. Per state, axe reported between 23 and 40 passing rules (for example 38 on the game screen, 40 on the start screen with the form).

**Passing rules worth naming** (from a short extra run, `passes.mjs`, that saved the rule ids for the start screen, the form, the game screen and the Settings page): `document-title` (2.4.2), `html-has-lang` and `html-lang-valid` (3.1.1), `autocomplete-valid` (1.3.5, on the sign-in form), `label` and `select-name` (form fields and the settings selects), `button-name`, `image-alt` and `image-redundant-alt`, `target-size` (2.5.8), `meta-viewport` and `meta-viewport-large` (zoom isn't blocked), `avoid-inline-spacing` (1.4.12, inline styles only), `aria-*` attribute and role rules, `aria-hidden-focus`, `nested-interactive`, `heading-order`, `empty-heading`, `page-has-heading-one`, `listitem`, the landmark rules and `region` (all content inside landmarks), `tabindex`. Inapplicable everywhere: `link-name` (there are no links), `video-caption` and `no-autoplay-audio` (no media).

## Details

### `color-contrast`: "Elements must meet minimum color contrast ratio thresholds"

- **Impact:** serious
- **Tags:** cat.color, wcag2aa, wcag143, TTv5, TT13.c, EN-301-549, EN-9.1.4.3, ACT
- **What axe says (every node):** "Element has insufficient color contrast of 1.14 (foreground color: #2e222f, background color: #201727 …). Expected contrast ratio of 4.5:1" (3:1 at Largest text, where the text counts as large).

**Affected nodes:**

| Selector | What it is | States |
| --- | --- | --- |
| `#adventure-log` | the "Adventure log" heading on its banner | 03, 09, 10, 11, 12, 13 |
| `ol > li`, `li:nth-child(n)` | log lines on the parchment | 03, 09, 10, 11, 12, 13 |
| `#actions-heading` | "Actions" banner | 03, 09, 10, 12, 13 (not 11: the panel is gone) |
| `#health-heading`, `#inventory-heading`, `#goal-heading` | the three banners in the bottom row | 03, 09, 10, 11, 12, 13 |
| `.book-page:nth-child(2) > p:nth-child(3)`, `… > p:nth-child(5)`, `p:nth-child(6)` | How to play text on the right page | 04 |
| `h3`, `p:nth-child(4)`, `p:nth-child(6)` | Settings page text | 05 |
| `.book-page:nth-child(2) > h3` | Account page heading on the right page | 06 |

**Verdict: false positive.** The ink colour `--ink: #2e222f` is drawn on parchment, but that parchment is a `border-image` with `fill`, not a `background-color`:

- `.panel-light` (the log and the end card): `src/ui/styles/base.css:168-176`, `border-image: url('/assets/ui/panel-parchment.png') 10 fill / 20px stretch` (line 170)
- `.banner` (every panel heading): `src/ui/styles/base.css:189-207`, `border-image: url('/assets/ui/banner.png') 1 18 fill / 2px 36px stretch` (line 201)
- `.book-page` (the book's left and right pages): `src/ui/styles/book.css:69-85`, lines 73 and 83

axe only reads `background-color` and `background-image` up the tree. It skips `border-image`, so it walks up to `body` and uses the page colour `--deep: #201727` (`src/ui/styles/base.css:35`). Ink on `#201727` is 1.14:1, which is the number in every message.

**Checked on the real pixels:** I sampled the screenshots (script `sample.mjs`, below) right next to the flagged text. Behind the log lines, the Actions, Health and Goal banners, and both book pages, the pixel is `#d8d3af` (parchment) every time, which gives **10.00:1** with ink, the same ratio as in `docs/wcag-notes.md` (1.4.3 table). The page background next to the panels is `#201727`, as axe says, but no text sits on it.

**More evidence:** in high contrast (states 07, 08, 08b) `high-contrast.css` turns the `border-image` art off and uses plain colours, and axe then finds no contrast violations at all, and no "needs review" either.

**One real caveat (not a WCAG failure today):** the parchment panels have no `background-color` behind the `border-image`. If the UI images fail to load (slow network, blocked images), the ink text would sit on `#201727` at 1.14:1 and be unreadable. A `background-color: var(--parchment)` with `background-clip: padding-box` on `.panel-light`, `.banner` and `.book-page` would be a safe fallback and would also let axe measure the right colour. Not changed: the scan is report-only.

## Incomplete ("needs review")

All of them are `color-contrast`, where axe couldn't work out the background. None is another rule.

| Reason axe gives | Elements | States | My reading |
| --- | --- | --- | --- |
| "uses complex text shadows" | `h1` (Lantern title) | 01, 02, 03, 09–13 | Parchment on `#201727`, 11.42:1 (notes, 1.4.3). The ink shadow is decoration (`src/ui/styles/game.css:19`, `src/ui/styles/start.css:69`). Passes. |
| "background gradient" | `.start-intro > p`, the account panel heading `#…-heading`, its `p`, `.account-switch`, and in 02 the form's `h3` and the email and password labels | 01, 02 | The start screen's `radial-gradient` (`src/ui/styles/start.css:30`). Notes: parchment on its lightest colour `#3e3546` is 7.69:1. Passes, but worth one check with a contrast checker by hand. |
| "element contains an image node" | `.page-banner`, book `h3` and `p`, `.setting-check`, the Text size and Log labels, account panel heading, labels and `.account-switch` in the book, the end card's `#end-heading`, text and `.end-stats` | 04, 05, 06, 11 | Same parchment `border-image` as above (book pages, end card). 10:1. |
| "partially obscured by another element" / "partially overlaps other elements" | older log lines (`ol > li:nth-child(1…15)`), some book `p` and `h3` | 04, 05, 06, 09, 10, 11 | Log lines scrolled up under the banner, and book text next to the tabs. Same parchment. Not a problem. |

## Screenshots

In the scratch directory (not in the repo): `shots/01-start.png`, `02-start-signin.png`, `03-game.png`, `04-menu-help.png`, `05-menu-settings.png`, `06-menu-account.png`, `07-game-hc-largest.png`, `08-menu-settings-hc-largest.png`, `09-fight.png`, `10-exit.png`, `11-end-defeat.png`, `12-game-320.png`, `13-game-320-largest.png` under

`/private/tmp/claude-501/-Users-elsagirardo-WU25-projects-lantern/bf02f68b-a2fd-4adb-a740-45aecbe252b2/scratchpad/shots/`

## Something odd during the scan (probably the headless browser, worth one manual check)

In the first run, a stray Enter in the fight opened the book on Settings instead of attacking. I traced it: after closing the book with Escape (opened from the header "Settings" button), the dialog's `close` event didn't arrive at once in headless Chrome, but about eight seconds later, when the next screenshot was taken. By then a fight had started and focus was on "Attack the demon". The late `close` ran `handleClose` in `src/ui/BookMenu.tsx:72-84`, which moved focus back to the Settings button, and the next Enter opened the book. In a normal browser `close` fires right after Escape, so I don't think a player can hit this. It happened every time with the order in `scan.mjs` (four runs: open and close the book twice, change settings through the store, scan, then fight), and not with a shorter script that opened and closed the book once. The fight, exit and end card states (09–11) were scanned again from a new game without opening the book first (script `scan2.mjs`), and those are the results above.

**Manual check suggested:** open Settings from the header, close it with Escape, click or tab to the map, walk into the demon, and check that focus stays on the attack button.

## Method (to repeat it)

All scripts are in `/private/tmp/claude-501/-Users-elsagirardo-WU25-projects-lantern/bf02f68b-a2fd-4adb-a740-45aecbe252b2/scratchpad/`:

- `cdp.mjs`: a small DevTools-protocol helper with no dependencies (Node's global `WebSocket`). It starts headless Chrome on port 9444 with its own profile, sends key events (`Input.dispatchKeyEvent`), takes screenshots, and injects axe from a local copy of the CDN file (`axe-vendor/axe.min.js`, downloaded from the URL above) with `Runtime.evaluate`, then runs `axe.run` with the tags above.
- `scan.mjs`: the main run (states 01–08 and 12–13).
- `scan2.mjs`: the fight, exit and end card states (09–11), each from a new game.
- `passes.mjs`: a short extra run that saves the passing and inapplicable rule ids (`passes/*.json`).
- `sample.mjs`: samples pixel colours from the screenshots and computes the WCAG ratio with ink.
- `explore.mjs`, `fightdebug.mjs`, `menufight.mjs`, `menufight2.mjs`, `repro-diag.mjs`, `repro-diag2.mjs`: exploring the Tab order and tracing the late `close` event.
- `results/*.json`: the full axe output per state (violations with nodes, incomplete); `results/notes.txt`: what the scripts saw (focus, positions, panel text).

Steps:

1. `npm run dev -- --port 5180 --strictPort` from the repo root, on a newly started server (so `import('/src/state/game-store.ts')` in the page gets the same store instance as the app).
2. `node scan.mjs`, then `node scan2.mjs` (Node 24+).
3. Move through the game with the keyboard: Tab to Start and Enter, arrow keys on the map, Enter on the attack button, arrow keys, Home and End on the book's tabs, Escape to close. The store was used for three things only: high contrast and Largest text (`updateSettings`), and health 0 for the end card. The UI was checked after each change (attributes on `<html>`, the end card's text).
4. Stop the dev server and Chrome.
