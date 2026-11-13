# WCAG 2.2 notes

Raw material for the written WCAG 2.2 AA evaluation (Fri Nov 13). Collected during the reviews and the screen reader checks; the evaluation itself is written from these.

**Status:** ✅ pass · 🔧 found and fixed · ⚠️ known issue (accepted, with the reason) · ⏳ not tested yet

**Testing setup:** macOS with VoiceOver, in Safari and Chrome. Keyboard only. No Windows screen readers (NVDA, JAWS) could be tested. Automated: one axe-core scan (Nov 13, `docs/axe-report-2026-11-13.md`).

## Perceivable

### 1.1.1 Non-text Content

- ✅ **The map has a text equivalent through the log** (rule 5: every event produces text). Enemies, exits, items and named decor are announced when the lantern reveals them (#51 for decor, VoiceOver check Nov 11).
- ✅ **UI icons are decoration** (`alt=""`) next to visible button text; item sprites in Inventory and Goal are `aria-hidden` next to the item's name (#53, code review Nov 12).

### 1.3.1 Info and Relationships

- ✅ **Headings, landmarks and lists:** each panel is a `section` named by its `h2` (Inventory, Goal, Your turn, Adventure log), the game screen has `header` and `main` (#53).
- 🔧 **Safari drops list semantics** on lists styled with `list-style: none`, so VoiceOver doesn't say "list, n items". Fixed with `role="list"` on the five lists (#53).
- ✅ **Settings are native, labelled controls** (checkboxes and selects), and the book is a native `<dialog>` with the WAI-ARIA tabs pattern (#53).

- ✅ **The Actions panel is always shown** (decided Nov 12–13, renamed from Your turn). It holds what the player can do now: the attack buttons in a fight, the exit button next to an exit, otherwise a dashed box with "Nothing to do here.", so the visible heading always has content for a screen reader too (rejected: hiding the idle panel with `aria-hidden`, a visible heading screen readers can't reach). The heading stays "Actions" in every state, so it's always found under one name; the log says "It's your turn." in a fight. It's shown at every width (Nov 13; it was first hidden in one column), so the panel and its heading are in the same place at normal size and at 400% zoom. ⏳ Check with VoiceOver.
- ✅ **Health has its own panel and heading** (Nov 13): "You: 8 / 12" as text, the bar `aria-hidden`, a list so enemies' lines can join it later (with their own log lines, rule 5).

### 1.3.2 Meaningful Sequence

- ✅ **DOM order matches the visual order** on the game screen, row by row (#53).
- ⚠️ **One exception, in the book:** the DOM order is Close, then the tabs, then the pages, but CSS draws the tab column on the right of the pages. The tabs pattern needs the tablist before the panel. ✅ Checked with VoiceOver in the #53 pass (Nov 13): the order felt right.

### 1.4.1 Use of Color

- ✅ **Health is text** ("You: 8 / 12"); the bar only repeats it and is `aria-hidden` (#53).
- ✅ **Errors in the account form** keep their "Error:" prefix, never colour alone (#50, #53).
- ✅ **High contrast lantern:** lit and dark tiles differ in brightness and a hard edge, not colour (#52).

### 1.4.3 Contrast (Minimum)

Ratios computed by Agent K with the WCAG formula from the pack's colours (#53):

| Pair | Ratio |
| --- | --- |
| Parchment `#d8d3af` on page `#201727` | 11.42:1 |
| Parchment on the start screen gradient's lightest `#3e3546` | 7.69:1 |
| Parchment on plum `#6d4e54` (panels, buttons) | 4.83:1 |
| Parchment on button hover `#5f434a` | 5.80:1 |
| Ink `#2e222f` on parchment (log, book, banners, end card) | 10.00:1 |
| Ink on input and select fill `#ebe6c6` | 12.02:1 |
| Error `#ffc9c2` on plum (start screen) | 5.02:1 |
| Error `#8b1e2d` on parchment (book) | 5.97:1 |
| High contrast: white, yellow `#ff0` and error on black | 21 / 19.56 / 14.39:1 |

- 🔧 **Two mockup colours failed** and were changed by Agent K: the hover `#7a5960` gave 4.05:1 with parchment text (now `#5f434a`), and the error red `#ffb3ab` was 4.28:1 on plum (now `#ffc9c2`).
- ⚠️ **axe flags the text on parchment** (Nov 13 scan): a false positive, see "Still to test". But it points at a real gap: the parchment panels have no `background-color` under the art, so if the images didn't load, the ink text would be 1.14:1 on the page. A `background-color: var(--parchment)` fallback would fix that (and silence axe). Not done yet.
- ⏳ Check a few pairs myself with a contrast checker for the evaluation.

### 1.4.4 Resize Text

- ✅ **Text size setting** (Normal, Large, Larger, Largest = 1×, 1.25×, 1.5×, 2×) scales every size in `rem` from one variable; the browser's own zoom still works on top (#53). In-between sizes are slightly soft in the pixel font; the player's choice wins (decided Nov 3).
- ⏳ Largest text on every screen, nothing cut off.

### 1.4.10 Reflow

- ✅ In Agent K's headless check: no sideways scroll at 320 CSS px wide, at 1000px with Large text, and at 1280px with Largest text and high contrast (#53).
- The map canvas is exempt (two-dimensional content), but CSS scales it down in narrow windows anyway.
- ⏳ A real 400% browser zoom in a 1280px window (Agent K used a 320px viewport instead).
- 🔧 **The health bar and "You: 12 / 12" spilled out of the Health panel** on a small screen with large text (my check, Nov 13). The list's grid column couldn't shrink below the bar's 7rem. Fixed with `grid-template-columns: minmax(0, 1fr)`, so the bar shrinks and the text wraps. ✅ Rechecked Nov 13.
- ⚠️ **"Adventure log" wraps onto two lines on its banner** on a small screen with large text (Nov 13): "log" sits over the ribbon's lower edge. Still readable and nothing is cut off, so accepted as a visual flaw.

### 1.4.11 Non-text Contrast

- ⚠️ **Plum buttons against the page background are 2.36:1.** Passes: the buttons are identified by their text and ink border, and 1.4.11 only asks for 3:1 on what's *needed* to identify a component. Mention in the evaluation.
- 🔧 **The browser's checkbox border is exactly 3.0:1** on parchment; the checkboxes got an ink ring (10:1) to be clear (#53).
- ✅ **Focus ring:** yellow `#f4d35e` is 11.81:1 on the page, 5.00:1 on plum and 9.69:1 on the book's edge; ink on parchment inside the log and book is 10:1.
- ✅ **High contrast hides the plum UI icons**, which would fail 3:1 on black (decided in the UI skin plan).

## Operable

### 2.1.1 Keyboard

- ✅ **The whole game is playable with the keyboard:** arrows to move, Enter or the exit button to use an exit, buttons to attack (Phase J, #35, VoiceOver checks Nov 4).
- ✅ **The book:** arrows, Home and End move between tabs; Escape and Close close it (#53, Agent K's headless check, and my VoiceOver pass Nov 13).

### 2.1.2 No Keyboard Trap

- ✅ **The map's `role="application"`** catches the arrow keys and Enter, but Tab still leaves it.
- ✅ **The book** uses `showModal()`: focus stays inside while it's open, and Escape always closes it.

### 2.2.1 Timing Adjustable

- ✅ **No time limits.** Turns wait for the player; the end card waits too (Play again is reached with Tab, whenever the player is ready).

### 2.3.1 Three Flashes

- ✅ **The hit flash** is one short tint per hit, never blinking, and skipped with reduced motion (#36).

### 2.3.3 Animation from Interactions (AAA, but part of the settings)

- ✅ **Reduced motion** stops the idle loops and the walking slide at once, and starts from the operating system's setting (#36, #52, checked Nov 12).

### 2.4.3 Focus Order

- 🔧 **Start screen: focus is no longer moved at load** (changed Nov 12, replacing decision 9). Moving it to Start made VoiceOver read Start twice and skip the page title. Now a screen reader reads from the top (title, intro, buttons), and Start is the first Tab stop, then How to play, Settings and the account panel. ⏳ Retest in Safari and Chrome.
- 🔧 **Safari's AutoFill took focus from Start** (found Nov 12). With a saved login, Safari moved focus to the email field as soon as the start screen loaded, even with VoiceOver off, so Enter no longer started the game. Fixed: on the start screen a guest sees Sign in and Create an account, and the form only appears when one is pressed (focus then goes to the form's heading). The book's Account tab shows the form at once. ⏳ Retest in Safari and Chrome.
- 🔧 **VoiceOver read Start, the title and the intro twice** on load, in Safari and Chrome (Nov 12). The code only moved focus once (checked in headless Chrome), and waiting for the page's load event didn't help, so it's VoiceOver's own behaviour with focus moved at load. Fixed by not moving focus at load (above).
- ✅ **Sign in and Create an account on the start screen** move focus to the form's heading, and Tab then reaches the email field with its label read (Chrome, Nov 12).
- ⚠️ **In Safari, AutoFill moves focus from the heading into the email field** as soon as the form appears (Nov 12), so the heading is skipped and the label is read. Accepted: the player pressed the button, and they land in the first field ready to type. Turning `autocomplete` off would stop it, but would break password managers (3.3.8).
- ✅ **Start moves focus to the map**, so the arrow keys work at once.
- 🔧 **The exit button now moves focus to the map** (#53 VoiceOver pass, Nov 13). Before, focus stayed on the button after the room change. The player arrives next to the exit back, so the button stays (relabelled "Go back to the previous room"), and Enter again went straight back: an easy loop between two rooms. The arrow keys also didn't move the player until they tabbed to the map. Now the button's click handler focuses the map after `takeExit()`, as after a fight. ✅ Checked with VoiceOver Nov 13.
- ✅ **The book:** focus goes to the selected tab on open, and back to the button that opened it on close. Checked with VoiceOver in the #53 pass (Nov 13): the reading order (Close, the tabs, then the pages) feels right, the arrow keys move between tabs, Escape closes, the checkboxes are read with their state and the Text size select with its value, and Brief still reads enemies and exits.
- ✅ **Account:** focus goes to the "Account" heading after sign-in and sign-out, also inside the book (Agent K's check; mine Nov 11 for the panel on its own).
- ✅ **End card doesn't take focus** (decided Nov 3–6, path A), so the last log lines are read first.
- ✅ **The end card covers the map** (Nov 13), on a dark see-through backdrop (solid black in high contrast), and the scene pauses, so the player doesn't keep bobbing after winning or dying. It's the same card, not a visual-only copy: it comes right after the map in the page, outside `role="application"`, so Tab from the map reaches Play again. In one column it sits under the map. Checked Nov 13 in the browser: the card covers the map, the player stops, the frozen frame isn't tinted red from the last hit, Tab from the map reaches Play again, and the backdrop is solid black in high contrast. ✅ Both endings with VoiceOver (#53 pass, Nov 13): the last log lines are read first, focus doesn't jump, VO + Right from the map reaches the card's heading, text, stats and Play again, and Play again reloads to the start screen. Victory was reached with the key added from the console, so finding the key wasn't part of this check.
- ⏳ My own Tab-through of the game screen.
- ⏳ **A late `close` event moved focus out of a fight?** In the Nov 13 axe scan (headless Chrome), the book's `close` event came about 8 s after Escape, and `handleClose` then moved focus from "Attack the demon" back to the Settings button. Probably the headless browser, but check by hand in Safari and Chrome: open Settings, press Escape, go back to the map, walk into a fight, and check that focus stays on the attack button.

### 2.4.7 Focus Visible

- ✅ **A 3px yellow outline** drawn by CSS on top of the art (`:focus-visible`), never hidden by a `border-image` (#53).

### 2.4.11 Focus Not Obscured (Minimum)

- 🔧 **A fight scrolled the map out of view** in a 1049×712 window (found Nov 13). Focus moved to the first attack button in the bottom row, below the window, so the browser scrolled 96px to show it, as 2.4.11 requires. Fixed by moving Your turn (now Actions) under the log, beside the map: the button is now in view whenever the map is (no scroll at 1049×712 or 1440×900, checked in headless Chrome). A three-column layout was tried first and dropped: too cluttered, and the log was too narrow at that width. In one column (narrow windows, zoom) the scroll is still needed and correct.

- ⏳ Check that no focused element is hidden behind the book or off screen at large text sizes.

## Understandable

### 3.2.1 On Focus

- ✅ **Focus only moves when the player acts** (Start, the book, a fight, sign-in). Since Nov 12 it no longer moves when the start screen loads. The page never moves focus because of what the screen reader is reading.

### 3.3.1 Error Identification and 3.3.2 Labels or Instructions

- ✅ **Account form errors** are text, linked with `aria-describedby` and `aria-invalid` (#50).
- 🔧 **The password rule was missing** on the sign-up form (a gap in Claude Code's brief); added, and moved between the label and the field so it's also read when the field is already filled (#50, Nov 10–11).

- 🔧 **The sign-up message said "Account created" for an email that already had an account** (found Nov 12). Supabase answers both cases the same, on purpose, so the form can't reveal which emails are registered. The message now fits both: "Check your email. If this is a new account, open the confirmation link, then sign in here. If you already have an account, you can sign in now." (#53)
- 🔧 **No visible hint on how to get the map's focus back** (found in the #53 VoiceOver pass, Nov 13). The arrow keys only work while the map has focus, and a click elsewhere or the book takes it away; only How to play explained it. Added a line next to the menu buttons: "Click the map or tab to it to play." ("press Tab" was dropped: from the log, Tab goes on to the panels, not back to the map) ⏳ Check the layout at narrow widths, Largest text and high contrast.

### 3.3.8 Accessible Authentication (Minimum)

- ✅ **Paste allowed, `autocomplete` for password managers, no puzzles or memory tests** (#50). Checked with Safari's generated password and pasting from Notes (Nov 11).

## Robust

### 4.1.2 Name, Role, Value

- ✅ **Native elements first** (`button`, `dialog`, `select`, `input`), ARIA only for the tabs pattern and `role="application"` on the map.
- ✅ **The map's name is just "Dungeon map"** (#53, decision 9), since the controls moved to How to play. The supervisors had raised the long, repeated label on Nov 5.

### 4.1.3 Status Messages

- ✅ **Game events go through a polite live region** in batches; low health is the one assertive message.
- ✅ **No second announcement** from the health display or the Goal panel: the log already says it (#53).
- ✅ **Brief log verbosity** leaves out decor lines but never enemies, exits, items or fights (#52, VoiceOver check Nov 12).
- ✅ **Account status** ("Signed in", "Signed out") in a status region (#50).

## Known issues (screen reader and browser behaviour)

- ⚠️ **VoiceOver's hints talk over the live regions** (found Nov 3). With hints on (the default), the long hint for the `role="application"` map and the button hint interrupt log lines. With hints off, everything is read as intended. **Kept `role="application"`** (decided Nov 4): NVDA and JAWS need it to pass the arrow keys to the game, and I can't test those. Recommendation for VoiceOver users: hints off.
- 🔧 **The start screen's intro needed hints on** (Nov 12): it was read as the Start button's description (`aria-describedby`), which VoiceOver reads as a hint, a conflict with the hints-off advice above. Gone since focus isn't moved at load: the title and intro are read as normal text, and the `aria-describedby` was removed.
- ⚠️ **Pressing quickly skips lines** (found Nov 3). Each action replaces the announcer's batch, and a key press cuts off speech. Accepted: the player chooses to skip, like skimming, and the whole log can be read afterwards.
- ⚠️ **At the start of a fight, the button is read before the lines** (Nov 3). Accepted: nothing is lost, and the button names the enemy. Still the same on Nov 13 (#53 VoiceOver pass), now that the attack buttons are in the Actions panel, in both Safari and Chrome: the button first, then the fight's lines.
- ⚠️ **Safari's AutoFill talks over "Signed out"** (Nov 11). In Chrome the message is read. It's in a status region and the panel shows the new state, so nothing is lost; Safari behaviour can't be changed from the page.
- ⚠️ **VoiceOver's read-through stopped in the password field** on the start screen (Nov 12). During continuous reading, focus follows the VoiceOver cursor, and VoiceOver stops in a text field so the user can type. Normal VoiceOver behaviour. Since the fix above, the start screen has no form fields at load, so ⏳ check whether the read-through now goes to the end.
- ✅ **After Start, only the map and the room description are read** (Nov 12). Intended: focus is on the map, and the rest of the page is reached with Tab or VO + arrows.
- ⚠️ **Safari doesn't say "Dungeon map" after Start** (#53 VoiceOver pass, Nov 13). Focus does move to the map: the yellow focus ring shows it, and the arrow keys move the player right away. VoiceOver reads the room description but not the map's name. In Chrome both are read, as intended. Likely cause (not confirmed): `App.tsx` moves focus to the map at the same moment the description goes into the live region, and Safari's VoiceOver lets the announcement replace the focus announcement. Nothing is lost for the player: the description says where they are, and the arrow keys work. Not fixed yet.
- ⚠️ **Chrome reads plain text as "clickable"** (#53 VoiceOver pass, Nov 13). In Chrome, VoiceOver says "clickable" after the text in the Health, Inventory and Goal panels, the Actions panel and the adventure log lines. Safari doesn't. None of these elements has a click handler. Likely cause (not confirmed): React puts its one click listener on the root element that holds the whole app, and Chrome reports text inside an element with a click listener as clickable, even when the listener is on an ancestor. The text is read correctly and nothing can be clicked there by mistake, so it's extra words, not lost information. React's event listening can't be changed without a big rewrite, so it stays a known issue.
- ⚠️ **The player's health total is only in the log when it's low or recovers.** The health display shows it at all times; a separate log line after each hit is decided (Nov 12) but not built yet.

## Fixed during the screen reader checks

- 🔧 **How to play promised health in the log** that the game doesn't give (#53 review, Nov 12). Changed to point at the health display.
- 🔧 **Focus stayed on the exit button after a room change** (#53 VoiceOver pass, Nov 13), which made an easy loop between two rooms. Now it moves to the map. See 2.4.3.
- 🔧 **The lantern light jolted a tile ahead** at the start of each step (Nov 12, `fix/lantern-slide`). Visual only, but the hard-edged high contrast lantern made it obvious.

## Still to test (Nov 12)

- ⏳ The full VoiceOver pass of all three rooms with the new UI.
- ✅ The axe-core scan (Nov 13): one serious rule, `color-contrast`, and every flagged node is a false positive: axe can't see the parchment drawn with `border-image`, so it measured ink on the dark page (1.14:1) instead of ink on parchment (10.00:1, checked from screenshot pixels). No violations on the start screen or with high contrast on. Details in `docs/axe-report-2026-11-13.md`.
- ⏳ 400% zoom, Largest text and high contrast on every screen, by hand.
- ✅ The end card with VoiceOver (game over and victory), Nov 13.
