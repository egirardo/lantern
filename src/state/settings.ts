import { z } from 'zod'

// The player's accessibility settings (Phase L). They live in the store next
// to the game state (rule 2), so Phaser and React read the same values, but
// they aren't game state: a new game or a room change never touches them, and
// they're saved on their own (the `settings` table, not `saves`).

// The schema is the one source of the shape: the Settings type is inferred
// from it. Agent D validates settings read from localStorage or Supabase with
// it, because that data can't be trusted (an old save, or a hand-edited one).
// strictObject, like the room files: an unknown field is a mistake, not
// something to keep.
export const settingsSchema = z.strictObject({
  // Sprites stay still: no idle loops, walking frames or sliding.
  reducedMotion: z.boolean(),
  // Stronger colours, the log in a system font, and a hard lantern edge.
  highContrast: z.boolean(),
  // Named steps instead of a number, so the dialog can show them as a radio
  // group. TEXT_SCALES says how big each one is.
  textSize: z.enum(['normal', 'large', 'larger', 'largest']),
  // 'brief' words the log shorter (e.g. skips decor reveals), but never
  // leaves out what a screen reader user needs (enemies, exits).
  logVerbosity: z.enum(['verbose', 'brief']),
})

export type Settings = z.infer<typeof settingsSchema>
export type TextSize = Settings['textSize']

// How much bigger each text size is than the default, as a multiplier for
// the root font size (in rem, so the browser's own zoom still works on top).
// Steps between 2× are allowed on purpose: a little soft for the pixel font,
// but the player's choice wins (decided Nov 3, WCAG 1.4.4).
// `satisfies` checks that every TextSize has a scale (a missing or misspelt
// key is a type error), while keeping the exact numbers as the type.
export const TEXT_SCALES = {
  normal: 1,
  large: 1.25,
  larger: 1.5,
  largest: 2,
} satisfies Record<TextSize, number>

// The settings a new player starts with. The operating system's "Reduce
// motion" setting is passed in instead of read here (the same injection as
// `random` in combat): tests run in Node, where there is no window.matchMedia,
// and this way a test can try both values.
export function defaultSettings(osReducedMotion: boolean): Settings {
  return {
    reducedMotion: osReducedMotion,
    highContrast: false,
    textSize: 'normal',
    logVerbosity: 'verbose',
  }
}

// Reads the operating system's "Reduce motion" setting through the
// prefers-reduced-motion media query. Only the store's default uses it, once,
// when the store is created. Outside a browser (in tests) there is no
// window, so it says false instead of crashing.
export function osPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
