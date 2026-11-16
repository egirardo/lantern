# WCAG 2.2 AA evaluation

## Introduction

The target for Lantern is **WCAG 2.2 level AA**. The game is one page: a start screen, the game screen (a canvas map and the accessible React layer around it), and a menu drawn as a book (How to play, Settings, Account).

How I tested:

- **Screen reader:** VoiceOver on macOS, in Safari and Chrome. I did the screen reader checks myself during the reviews, a full pass of the new UI (#53) on Nov 13, and a full pass of all three rooms on the live site (a production build) on Nov 16.
- **Keyboard only:** every feature was played with the keyboard, without a mouse.
- **Automated:** one axe-core 4.10.2 scan in headless Chrome on Nov 13, in 14 states (start screen, sign-in form, game screen, a fight, next to an exit, the end card, every menu page, high contrast with Largest text, and a 320px wide window). See `docs/axe-report-2026-11-13.md`.
- **Automated, again:** I re-scanned the live site myself on Nov 16 with the axe DevTools extension in Chrome (WCAG 2.2 AA, best practices on), after the parchment fallback (#59, #62): the start screen, the sign-in form, the open book, the game screen, a fight, the end card (game over), and high contrast on the start screen, the game screen, the book and the end card. No violations and no warnings in any of them. I scanned with WCAG 2.1 AA first and then again with WCAG 2.2 AA, which adds `target-size` (2.5.8); both were clean.
- **Headless checks:** focus order, sideways scroll at 320px and other widths, and the layout with large text, checked in headless Chrome (by Agent K in #53 and in the axe scan).
- **Zoom and text size:** the game's own text size setting (up to 2×), Largest text at 320px and 1280px, and small screens with large text by hand.
- **Contrast:** ratios computed with the WCAG formula from the pack's colors (Agent K, #53), and the axe scan's results checked against the real pixels.
- **Art blocked:** the UI with its images blocked in DevTools, to check the parchment fallback (Nov 15, #59, #62).
- **Text spacing:** a bookmarklet that sets the four WCAG 1.4.12 values (line height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em) with `!important` (Nov 16).
- **Voice Control:** macOS Voice Control for 2.5.3 Label in Name (Nov 16).
- **Code check:** for criteria that are about how the page is built rather than how it behaves (input purpose, error messages, consistent names, hover content), Claude Code read the components, the CSS and the UI text (Nov 16), and I then checked each verdict by hand. One of them (3.3.3) turned out to be wrong in the browser.

VoiceOver results only count from a production build (a Vercel preview or `npm run preview`). On Nov 15 the development server made Safari skip announcements that the deployed build reads correctly (see "Known issues").

Limits:

- **No Windows screen readers.** NVDA and JAWS couldn't be tested, so the choices made for them (above all `role="application"` on the map) are untested.
- **No mobile screen readers** (VoiceOver on iOS, TalkBack).
- **No users with disabilities** took part. Every check was done by me (and by agents in headless Chrome).
- **Two one-off axe scans** (Nov 13 and Nov 16), not automated tests on every pull request (Playwright and axe-core were cut from the plan on Nov 2).

Verdicts: **Pass** (tested and meets it, open rechecks noted), **Partial** (meets most of it, but part is untested or has an accepted issue), **Fail**, **N/A** (the content the criterion covers doesn't exist), **Not tested** (it needs a test in the browser that hasn't been done).

## All WCAG 2.2 A and AA success criteria

4.1.1 Parsing is left out: it was removed in WCAG 2.2.

| Criterion | Level | Verdict | Evidence |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | Pass | The map's content is in the log as text (rule 5); icons are `alt=""` next to button text; item sprites `aria-hidden` next to the name. axe `image-alt` passes. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | N/A | The game has no audio or video (axe: `video-caption`, `no-autoplay-audio` inapplicable). |
| 1.2.2 Captions (Prerecorded) | A | N/A | No video. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | N/A | No video. |
| 1.2.4 Captions (Live) | AA | N/A | No live media. |
| 1.2.5 Audio Description (Prerecorded) | AA | N/A | No video. |
| 1.3.1 Info and Relationships | A | Pass | Sections named by `h2`, `header`, `main` and a `footer`, `role="list"` for Safari, native labeled controls, `<dialog>` with the tabs pattern. axe heading, list, label and landmark rules pass. Actions panel checked with VoiceOver on the live site (Nov 16). |
| 1.3.2 Meaningful Sequence | A | Pass | DOM order matches the visual order; the book's order (Close, tabs, pages) checked with VoiceOver Nov 13. |
| 1.3.3 Sensory Characteristics | A | Pass | Instructions name things, never only by shape or place: "the exit button in the Actions panel", "Click the map or tab to it". Reveal lines give a name and a compass direction ("A crate appears to the east"). Checked by hand Nov 16. The exit button appears in Actions without an announcement; the log line says "Press Enter to use it", which works from the map, where focus is. |
| 1.3.4 Orientation | AA | Pass | No orientation lock anywhere in the code or CSS. Checked by hand Nov 16: in portrait and landscape at different widths, the layout stays usable and goes to one column when narrow. |
| 1.3.5 Identify Input Purpose | AA | Pass | `autocomplete` on the email and password fields (#50); axe `autocomplete-valid` passes on the sign-in form. |
| 1.4.1 Use of Color | A | Pass | Health as text, errors with an "Error:" prefix, the high contrast lantern differs in brightness and edge. |
| 1.4.2 Audio Control | A | N/A | No audio. |
| 1.4.3 Contrast (Minimum) | AA | Pass | All text pairs 4.83:1 or more (computed, and four pairs checked with WebAIM's Contrast Checker on Nov 16). axe's Nov 13 `color-contrast` violations were false positives (parchment drawn by `border-image`; real ratio 10.00:1, checked on the pixels). With the parchment `background-color` fallback (#59, #62), the Nov 16 re-scan found no violations. |
| 1.4.4 Resize Text | AA | Pass | Text size setting up to 2×, all in `rem`; browser zoom works on top (axe `meta-viewport` passes). No sideways scroll at Largest text. Largest text checked by hand on every screen on Nov 13 (with the 400% zoom check): nothing cut off. |
| 1.4.5 Images of Text | AA | Pass | All text is real text in the pixel font; the pack's images (banners, panels, icons, book tabs) have no words in them. Checked by hand Nov 16. |
| 1.4.10 Reflow | AA | Pass | No sideways scroll at 320px (normal and Largest text), 1000px Large and 1280px Largest + high contrast; a real 400% browser zoom checked by hand (Nov 13); Largest text with high contrast on every screen checked by hand (Nov 16). The map canvas is exempt. ⚠️ "Adventure log" wraps over its ribbon. |
| 1.4.11 Non-text Contrast | AA | Pass | Focus ring 5.00:1 or more; checkboxes got an ink ring; plum buttons on the page are 2.36:1 but are identified by text and ink border (accepted, see below). |
| 1.4.12 Text Spacing | AA | Pass | Checked by hand Nov 16 with a text spacing bookmarklet (the four WCAG values) on every screen, the book, a fight and the end card: nothing cut off or overlapping, all text readable. The layout adapts but nothing is lost: the health bar wraps under "You: 12 / 12", the taller page puts the footer after the content, and the header's hint sits higher than the buttons (the bookmarklet's 2em space after paragraphs is centered with it). axe `avoid-inline-spacing` passes. |
| 1.4.13 Content on Hover or Focus | AA | N/A | Nothing appears on hover or focus: `:hover` only changes a button's color, and there are no tooltips or `title` attributes. Checked by hand Nov 16 (hover and Tab over the buttons). |
| 2.1.1 Keyboard | A | Pass | The whole game with arrows, Enter and buttons; the book with arrows, Home, End, Escape (VoiceOver pass Nov 13). |
| 2.1.2 No Keyboard Trap | A | Pass | Tab leaves the `role="application"` map; the modal book always closes with Escape. |
| 2.1.4 Character Key Shortcuts | A | N/A | No single-character shortcuts: only arrows, Enter, Tab, Escape, Home and End (README key table). |
| 2.2.1 Timing Adjustable | A | Pass | No time limits; turns and the end card wait for the player, and the last log line says "Press Tab to reach Play again" (#60). |
| 2.2.2 Pause, Stop, Hide | A | Pass | The idle animations loop, and Reduce motion stops them; it starts on with the OS setting (#36, #52, checked Nov 12). Reduce motion is the "stop" mechanism. |
| 2.3.1 Three Flashes or Below Threshold | A | Pass | The hit flash is one short tint per hit, never blinking, and off with Reduce motion. |
| 2.4.1 Bypass Blocks | A | Pass | `header`, `main` and `footer` landmarks and a heading per panel (1.3.1); axe landmark and `region` rules pass. No skip link: landmarks and headings let a screen reader user jump past blocks. |
| 2.4.2 Page Titled | A | Pass | The page title is "Lantern"; axe `document-title` passes. |
| 2.4.3 Focus Order | A | Pass | Many fixes (start screen, AutoFill, exit button, book, account); all rechecked. ⚠️ Safari AutoFill moves focus into the email field. My own Tab-through of the game screen on Nov 16: the order is correct. |
| 2.4.4 Link Purpose (In Context) | A | Pass | The only link is in the footer (#65): "Source code on GitHub", underlined, opens in the same tab. VoiceOver reads "Source code on GitHub, link". |
| 2.4.5 Multiple Ways | AA | N/A | One page, not a set of pages. |
| 2.4.6 Headings and Labels | AA | Pass | A heading per panel, "Actions" in every state, labeled settings and form fields (axe `empty-heading`, `label` pass). |
| 2.4.7 Focus Visible | AA | Pass | 3px yellow `:focus-visible` outline, never hidden by a `border-image`; ink inside the log and book. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Pass | Fixed: the attack button is now in view beside the map. Checked by hand on Nov 16 at Largest text, on the game screen and in the book: nothing focused is hidden. |
| 2.5.1 Pointer Gestures | A | N/A | No multipoint or path gestures: everything is a click or a key. |
| 2.5.2 Pointer Cancellation | A | Pass | Every action is a native `button` with `onClick`, which fires on release. A click on the map only gives it focus; Phaser's mouse input is off. Checked by hand Nov 16: pressing down on a button and moving off before release does nothing. |
| 2.5.3 Label in Name | A | Pass | Buttons are named by their visible text ("How to play", "Attack the demon"). The book's tabs and Close have no visible text, so 2.5.3 doesn't apply to them (see Known issues). Checked by hand Nov 16 with macOS Voice Control: saying "Click" and a button's visible text clicks it. This includes the Actions panel: the exit button ("Go back to the previous room") and "Attack the demon" both worked when they were on screen. |
| 2.5.4 Motion Actuation | A | N/A | Nothing is triggered by moving the device. |
| 2.5.7 Dragging Movements | AA | N/A | No dragging. |
| 2.5.8 Target Size (Minimum) | AA | Pass | axe `target-size` passes in every scanned state, on Nov 13 and in my Nov 16 re-scan with WCAG 2.2 AA. |
| 3.1.1 Language of Page | A | Pass | `<html lang="en">`; axe `html-has-lang` and `html-lang-valid` pass. |
| 3.1.2 Language of Parts | AA | N/A | All content is in English. |
| 3.2.1 On Focus | A | Pass | Focus only moves when the player acts; no longer moved at load. |
| 3.2.2 On Input | A | Pass | Settings apply at once but never change context (no new page, no focus move); the account form does nothing until it's submitted. Checked by hand Nov 16: focus stays on each setting when it changes. |
| 3.2.3 Consistent Navigation | AA | Pass | How to play and Settings come in the same order on the start screen and the game screen, with Account after them. Checked by hand Nov 16. |
| 3.2.4 Consistent Identification | AA | Pass | The same functions have the same names on both screens and in the book (How to play, Settings, Account). Checked by hand Nov 16. |
| 3.2.6 Consistent Help | A | Pass | How to play is in the same place in the order on both screens, and the book opens on it. Checked by hand Nov 16. |
| 3.3.1 Error Identification | A | Pass | Account form errors as text, `aria-describedby` and `aria-invalid` (#50). |
| 3.3.2 Labels or Instructions | A | Pass | Password rule shown and read; hint "Click the map or tab to it to play." added; the end lines say how to reach Play again (#60). The hint checked by hand on Nov 16 at narrow widths, Largest text and high contrast. |
| 3.3.3 Error Suggestion | AA | Pass | Every account error says what to do (`auth-messages.ts`): the password rule in the weak password message, "Sign in instead" for an existing account, and "Check the email address. It should look like name@example.com." 🔧 An email without "@" got the generic "Something went wrong" until #69 (found and fixed Nov 16). Checked by hand on Nov 16, after the fix: an email without "@" and a weak password. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | N/A | No legal or financial commitments or test answers; the account form only signs in to or creates the player's own account. |
| 3.3.7 Redundant Entry | A | Pass | The fields keep what was typed when switching between Sign in and Create an account, and after signing up the form switches to Sign in with the email still filled in. Checked by hand when the panel was built (#50) and again on Nov 16. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Pass | Paste allowed, `autocomplete` for password managers, no puzzles; checked with Safari's generated password and pasting (Nov 11). |
| 4.1.2 Name, Role, Value | A | Pass | Native elements first, ARIA only for the tabs pattern and the map; the map is named "Dungeon map". axe ARIA and `button-name` rules pass. ⚠️ Chrome adds "clickable" to plain text. |
| 4.1.3 Status Messages | AA | Pass | A polite live region for game events, with the health left after each hit (#61), assertive only for low health, a status region for account messages. ⚠️ VoiceOver hints and Safari AutoFill can talk over messages. |

**Count:** 41 Pass, 0 Partial, 0 Fail, 14 N/A, 0 Not tested (out of 55). No Partial or Fail, but many passes have open rechecks (⏳), every code check verdict has been checked by hand, and every criterion has now been tested.

## Notes per criterion

### 1.1.1 Non-text Content

The map is a canvas, so a screen reader can't see it. Everything on it also goes into the adventure log as text: enemies, exits, items and named decor are announced when the lantern reveals them, with a direction ("A crate appears to the east"). I checked the decor reveals with VoiceOver on Nov 11. In the UI, the pack's icons are `alt=""` because the button text next to them is the name, and the item sprites in Inventory and Goal are `aria-hidden` next to the item's name.

### 1.3.1 Info and Relationships

Each panel is a `section` named by its `h2` (Adventure log, Actions, Health, Inventory, Goal), and the game screen has a `header` and a `main`. Since #65 both screens also end with a `footer` outside `main`, the page's "content information" landmark. Safari drops list semantics on lists with `list-style: none`, so VoiceOver didn't say "list, n items"; I fixed that with `role="list"` on the five lists. Settings are native checkboxes and selects with labels, and the book is a native `<dialog>` with the WAI-ARIA tabs pattern.

The Actions panel is always shown, also when there's nothing to do ("Nothing to do here." in a dashed box), so the heading always has content and is always found under the same name. I rejected hiding the idle panel with `aria-hidden`, because that leaves a visible heading screen readers can't reach. Health has its own panel with the number as text ("You: 8 / 12"), and during a fight a row for each enemy ("Demon: 6 / 10", #61); the bars are `aria-hidden`.

On Nov 16 I checked the Actions panel with VoiceOver on the live site, next to an exit and in a fight: "Actions" is read as a heading, with its content after it.

### 1.3.2 Meaningful Sequence

The DOM order matches the visual order on the game screen, row by row. The one exception is the book: the DOM order is Close, the tabs, then the pages, but CSS draws the tab column on the right. The tabs pattern needs the tablist before the panel, so I kept it, and in the VoiceOver pass on Nov 13 the reading order felt right.

### 1.4.1 Use of Color

Health is text, and the bar only repeats it. Errors in the account form start with "Error:", so they don't rely on red. In high contrast, lit and dark tiles differ in brightness and a hard edge, not in color.

### 1.4.3 Contrast (Minimum)

Agent K computed the ratios with the WCAG formula from the pack's colors (#53). The lowest text pair is parchment on plum, 4.83:1. Two colors from the mockup failed and were changed: the button hover (4.05:1, now `#5f434a`, 5.80:1) and the error red on plum (4.28:1, now `#ffc9c2`, 5.02:1). In high contrast every pair is 14:1 or more.

The axe scan reported `color-contrast` as serious on the log, the panel banners and the book pages: ink on `#201727`, 1.14:1. That's a false positive. The parchment behind that text is drawn with `border-image` (`base.css:170`, `base.css:201`, `book.css:73` and `83`), which axe can't read, so it measures against the page behind. The real pixels behind the text are `#d8d3af`, 10.00:1 with ink. In high contrast, where the art is turned off, axe finds no contrast problems at all.

The scan pointed at a real gap, though: the panels had no `background-color` under the art, so if the images didn't load, the ink text would be on the dark page at 1.14:1. Fixed on Nov 15 (#59): the log, the end card, the banners, the book pages and the start screen's Account heading have a parchment `background-color` under the art. On the banners it first showed as a beige box through the ribbon's see-through notches, so there it only covers the area behind the text (#62). In high contrast the book pages and banners have no background, since `--parchment` turns white there. Checked on a production build with the art blocked in DevTools.

On Nov 16 I scanned the live site again with the axe DevTools extension, in the same kinds of states (start screen, sign-in form, the book, the game screen, a fight, the end card, and high contrast on the start screen, the game screen, the book and the end card), with WCAG 2.2 AA and best practices on. The `color-contrast` violations are gone, and axe reported nothing else. Now that the parchment is a `background-color` too, axe measures the ink against the right color. So the false positive pointed at a real gap, and fixing the gap also fixed the scan result. A clean scan only means that none of axe's automated rules failed in the states I scanned. Most of this evaluation rests on the VoiceOver and keyboard testing.

On Nov 16 I checked four pairs myself with WebAIM's Contrast Checker: parchment on plum 4.83:1 (the lowest text pair), ink on parchment 9.99:1, error on plum 5.01:1, and the yellow focus ring on plum 4.99:1 (1.4.11). The 0.01 differences from the computed numbers are rounding: WebAIM cuts off after two decimals.

### 1.4.4 Resize Text

The Text size setting has Normal, Large, Larger and Largest (1×, 1.25×, 1.5×, 2×). Every size is in `rem` from one variable, so everything grows, and the browser's own zoom still works on top. In-between sizes are slightly soft in the pixel font; I decided the player's choice wins (Nov 3). In the axe scan, Largest text at 1280px (with high contrast) and at 320px had no sideways scroll.

On Nov 13 I checked Largest text on every screen by hand, together with the 400% zoom, and nothing was cut off.

### 1.4.10 Reflow

No sideways scroll at 320 CSS px wide, at 1000px with Large text, and at 1280px with Largest text and high contrast (Agent K's check, and again in the axe scan, also 320px with Largest text). The map canvas is two-dimensional content and exempt, but CSS scales it down anyway.

Found and fixed: the health bar and "You: 12 / 12" spilled out of the Health panel on a small screen with large text, because the grid column couldn't shrink below the bar's width. Fixed with `minmax(0, 1fr)` and rechecked Nov 13.

Known issue: "Adventure log" wraps onto two lines on its banner on a small screen with large text, and "log" sits over the ribbon's edge. It's readable and nothing is cut off, so I accepted it as a visual flaw.

On Nov 13 I also checked a real 400% browser zoom by hand, and the layout reflowed with nothing lost. On Nov 16 I checked Largest text with high contrast on every screen, and it looks right.

### 1.4.11 Non-text Contrast

The plum buttons are 2.36:1 against the page. I count this as a pass: 1.4.11 asks for 3:1 on what's needed to identify the component, and the buttons are identified by their text and their ink border. The browser's checkbox border was exactly 3.0:1 on parchment, so the checkboxes got an ink ring (10:1). The yellow focus ring is 11.81:1 on the page, 5.00:1 on plum and 9.69:1 on the book's edge; inside the log and book the ring is ink (10:1). High contrast hides the plum icons, which would fail on black.

### 2.1.1 Keyboard

The whole game is playable with the keyboard: arrows to move, Enter or the exit button to use an exit, buttons to attack (Phase J, #35, VoiceOver checks Nov 4). In the book, the arrow keys, Home and End move between tabs, and Escape or Close closes it; checked by Agent K in headless Chrome and by me in the VoiceOver pass on Nov 13.

### 2.1.2 No Keyboard Trap

The map has `role="application"` so it gets the arrow keys and Enter, but Tab still leaves it. The book uses `showModal()`, so focus stays inside while it's open, and Escape always closes it.

### 2.2.1 Timing Adjustable

There are no time limits. Turns wait for the player, and the end card waits too. The end lines used to say "Reload the page to play again"; since #60 they say "Press Tab to reach Play again", since the end card doesn't take focus and comes right after the map.

### 2.3.1 Three Flashes

The hit flash is one short tint per hit, never blinking, and it's skipped with Reduce motion (#36).

### 2.3.3 Animation from Interactions (AAA, but part of the settings)

Not required for AA, but it's one of the settings. Reduce motion stops the idle loops and the walking slide at once, and starts on when the operating system asks for less motion (#36, #52, checked Nov 12). I also count this as the way to stop the looping animations for 2.2.2.

### 2.4.3 Focus Order

This took the most work:

- **Start screen:** focus is no longer moved at load (changed Nov 12). Moving it to Start made VoiceOver read Start, the title and the intro twice and skip the page title. Now a screen reader reads from the top, and Start is the first Tab stop (confirmed in the axe scan's headless run: Start, How to play, Settings, Sign in, Create an account).
- **Safari's AutoFill took focus from Start** when a login was saved, so Enter didn't start the game. Fixed: the start screen shows Sign in and Create an account, and the form only appears when one is pressed, with focus on the form's heading.
- **Known issue:** in Safari, AutoFill still moves focus from that heading into the email field. Accepted: the player asked for the form and lands ready to type. Turning `autocomplete` off would break password managers (3.3.8).
- **Start moves focus to the map**, so the arrow keys work at once.
- **The exit button now moves focus to the map** after the room change (fixed Nov 13). Before, focus stayed on the button, now labeled "Go back to the previous room", which made an easy loop between two rooms. Checked with VoiceOver.
- **The book:** focus goes to the selected tab on open and back to the button that opened it on close (VoiceOver pass Nov 13).
- **Account:** focus goes to the "Account" heading after signing in and out.
- **End card:** it doesn't take focus, so the last log lines are read first. It comes right after the map in the DOM, so Tab from the map reaches Play again. Checked for both endings with VoiceOver on Nov 13 (victory with the key added from the console).

- **Footer link:** the last Tab stop on both screens, after the map and the panels, so it never gets in the way of playing; inert behind the open book (#65).

During the axe scan, the headless browser delivered the book's `close` event late once, and that moved focus from an attack button to the Settings button. I checked it by hand on Nov 15 in Safari and Chrome (open Settings, Escape, back to the map, walk into a fight): focus stayed on the attack button, so it was the headless browser, not the game.

On Nov 16 I did my own Tab-through of the game screen, and the focus order is correct.

### 2.4.7 Focus Visible

A 3px yellow outline drawn with `:focus-visible` on top of the art, so a `border-image` frame can't hide it.

### 2.4.11 Focus Not Obscured (Minimum)

A fight scrolled the map out of view in a 1049×712 window: focus moved to the attack button in the bottom row, and the browser scrolled to show it. I fixed it by moving Actions under the log, beside the map, so the button is in view whenever the map is (checked at 1049×712 and 1440×900). A three-column layout was tried first and dropped. In one column (narrow windows, zoom) the scroll is still needed, and correct.

On Nov 16 I tabbed through the game screen and the book at Largest text, and nothing focused was hidden.

### 3.2.1 On Focus

Focus only moves when the player acts (Start, the book, a fight, sign-in), and since Nov 12 never when the start screen loads.

### 3.2.3, 3.2.4 and 3.2.6: consistent navigation, names and help

The start screen has Start, How to play and Settings, then the Account panel. The game screen's header has How to play, Settings and Account. The help and menu buttons come in the same order with the same names on both screens, and the book's tabs use the same names. How to play is the help, and it's always the first menu button. Checked by hand on Nov 16.

### 3.3.1 Error Identification and 3.3.2 Labels or Instructions

Account form errors are text, linked to the field with `aria-describedby` and `aria-invalid` (#50). The password rule was missing on the sign-up form; it's now between the label and the field, so it's read even when the field is filled. The sign-up message said "Account created" for an email that already had an account; it now fits both cases without revealing which emails are registered.

The arrow keys only work while the map has focus, and only How to play explained how to get it back. I added a visible line next to the menu buttons: "Click the map or tab to it to play." On Nov 16 I checked that line at narrow widths, Largest text and high contrast, and it's fully visible and readable.

### 3.3.3 Error Suggestion and 3.3.7 Redundant Entry

The account errors are chosen from Supabase's error codes in `auth-messages.ts`, not copied from Supabase's developer messages. Each one says what to do next: check the email's format, choose a password that meets the rule (the rule is repeated), sign in instead, wait and try again, or open the confirmation email. A wrong email or password gets one message for both on purpose, so the form doesn't reveal which emails have accounts. The network and unknown errors say that guest play still works.

Found and fixed on Nov 16: the code check said the email message was there, but when I tested it, an email without "@" ("elsa.sk2hotmail.com") got "Something went wrong. Try again in a moment." Supabase most likely answers it with an error code that isn't in the table (not confirmed), so the message fell through to the generic one. The form only checked that the fields weren't empty. Since #69 it also checks the email's shape before sending (something, one "@", something, no spaces; loose on purpose, so no working address is turned away) and shows "Check the email address. It should look like name@example.com." on the email field, with `aria-invalid` and focus moved there. Released the same day (#70). Checked by hand after the fix, with an email without "@" and with a weak password. This is also why reading the code isn't enough on its own: the code had the right message, but the server never sent the code it was waiting for.

Nothing has to be typed twice. Switching between Sign in and Create an account keeps the fields, and after signing up the form switches to Sign in with the email still filled in, so the player can sign in once they've clicked the confirmation link. The fields are only cleared after a successful sign-in. I checked switching between the two forms by hand when the panel was built (#50), and again on Nov 16.

### 3.3.8 Accessible Authentication (Minimum)

Paste is allowed, the fields have `autocomplete` for password managers, and there are no puzzles or memory tests (#50). I checked it with Safari's generated password and with pasting from Notes (Nov 11).

### 4.1.2 Name, Role, Value

Native elements first (`button`, `dialog`, `select`, `input`), and ARIA only for the tabs pattern and `role="application"` on the map. The map's name is just "Dungeon map" since the controls moved to How to play; my supervisors had pointed out that the long label was repeated on every focus (Nov 5).

### 4.1.3 Status Messages

Game events go through a polite live region in batches, and low health is the one assertive message. Since #61 the log also says the health left after every hit that leaves the target standing ("You have 8 out of 12 health.", "The demon has 6 out of 10 health."), so a screen reader user doesn't have to leave the log to find it. There's no line after a killing blow, and none when the low health warning already says the number. The health display and the Goal panel don't announce anything themselves, because the log already says it. Brief log verbosity leaves out decor lines but never enemies, exits, items or fights (checked with VoiceOver Nov 12). Account messages ("Signed in", "Signed out") are in a status region.

## Known issues

These were found and accepted. Most are screen reader or browser behavior that the page can't control.

- **VoiceOver's hints talk over the live regions.** With hints on (the default), the long hint for the `role="application"` map and the button hints interrupt log lines. With hints off, everything is read as intended. I kept `role="application"` because NVDA and JAWS need it to pass the arrow keys to the game, and I can't test those. The README advises VoiceOver users to turn hints off.
- **Pressing quickly skips lines.** Each action replaces the announcer's batch, and a key press cuts off speech. Accepted: the player chooses to skip, and the whole log can be read afterwards.
- **At the start of a fight, the attack button is read before the fight's lines** (Safari and Chrome, still on Nov 13). Nothing is lost, and the button names the enemy.
- **Safari's AutoFill talks over "Signed out"** and moves focus into the email field when the form appears. Chrome is fine. It's Safari behavior the page can't change.
- **Chrome reads plain text as "clickable"** in the panels and the log. Likely cause, not confirmed: React's one click listener on the app's root. Extra words, no lost information; it can't be changed without a big rewrite.
- **The book's tabs and Close button have no visible text** (Nov 15). On screen they're icons only. Their names ("How to play", "Settings", "Account", "Close") are visually hidden text, so screen readers and voice control get them, and high contrast shows them. With macOS Voice Control (Nov 16), "Click Account" and the other tab names work at once. "Click Close" showed a number next to the Close button, and saying the number closed the book. The same happened with "Click High contrast", whose label is visible, so it isn't caused by the hidden name: it's Voice Control asking to confirm (why it does it for some names and not others isn't known). Both still work, with one extra step. A sighted player has to guess from the icons, and with the UI art blocked the tabs and Close can't be seen at all (Escape still closes the book). A `title` tooltip wouldn't help: it's mouse only and never shown on keyboard focus. A hint on hover and focus would have to meet 1.4.13, so it needs design work. Visible labels are planned after the freeze.
- **The icons don't follow the text size setting.** Browser zoom scales them, and 1.4.4 covers text, so it still passes, but it matters most for the icon-only book tabs. Planned after the freeze: scale them in whole 16px steps so the pixel art stays sharp.
- **"Adventure log" wraps over its ribbon** on a small screen with large text (visual only).
- **Plum buttons are 2.36:1 against the page** (passes 1.4.11, see above).

Resolved:

- **Safari didn't say "Dungeon map" after Start** (Nov 13). On Nov 15, the deployed build read "Dungeon map" and then the room description, after both Start and Continue. On the development server Safari was unreliable the same day, and the deployed Nov 13 build worked too, so the code hadn't changed: the development build caused it (StrictMode runs effects twice, and hot reload swaps code into a running page). Since then VoiceOver results only count from a production build.
- **The player's health total was only in the log when it was low or recovered.** Fixed in #61: a health line after every hit (see 4.1.3).
- **The parchment panels had no background color fallback.** Fixed in #59 and #62 (see 1.4.3).

## Not fixed before the code freeze

- Visible labels on the book's tabs and Close button, and icons that follow the text size.
- Chrome's "clickable" on plain text.
- Automated axe and Playwright tests on every pull request (cut on Nov 2; one scan instead).

## Still to test

Everything from my notes and the axe scan has been tested. On Nov 16 I also confirmed the last three items on the live site: a full VoiceOver pass of all three rooms with the new UI on a production build, the start screen's focus order in Safari and Chrome, and that VoiceOver's read-through of the start screen goes to the end now that there are no form fields at load.

What's left can't be tested with what I have:

- NVDA and JAWS on Windows (no access).
- VoiceOver on iOS and TalkBack on Android.
- Testing with users with disabilities.
