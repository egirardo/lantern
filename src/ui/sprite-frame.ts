import { z } from 'zod'
import { SPRITES, TEXTURES, type SpriteName } from '../assets/manifest'

// Helpers for showing one frame of the game's sprite sheet in the DOM (the
// gold key in Inventory and Goal). The sheet is one big image; the atlas
// (sprites.json) says where each frame sits on it. A frame is shown as a CSS
// background: the whole sheet, scaled up, moved so only the frame shows
// through a box the frame's size. Art is found by its logical name through
// the asset manifest (rule 7), never by a file path.

// How much bigger than the sheet's pixels a sprite is drawn: 16 px × 3 =
// 48 px. A whole number, so each art pixel is exactly 3×3 screen pixels and
// stays sharp (the same zoom the map uses).
export const SPRITE_SCALE = 3

// The parts of the atlas this needs. Phaser reads the same file for the map.
// Checked with Zod because it's fetched at runtime, so TypeScript can't know
// its shape; a broken file fails loudly instead of drawing the wrong frame.
const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
})
const atlasSchema = z.object({
  frames: z.record(z.string(), z.object({ frame: rectSchema })),
  meta: z.object({ size: z.object({ w: z.number(), h: z.number() }) }),
})
export type Atlas = z.infer<typeof atlasSchema>
type Rect = z.infer<typeof rectSchema>

// The atlas frame a sprite is shown with outside the map: its first idle
// frame, e.g. 'gold-key-' + 0 = 'gold-key-0'. Items have one frame only.
export function stillFrameName(name: SpriteName): string {
  const sprite = SPRITES[name]
  return `${sprite.framePrefix}${sprite.animations.idle.frames[0]}`
}

// The CSS for a box that shows `frame` at `scale`. Pure, so it's tested.
// - background-size scales the whole sheet, so the frame inside it scales too;
// - background-position moves the sheet left and up (negative numbers) by
//   the frame's scaled position, so the frame lands in the box's corner;
// - width and height make the box exactly the frame's scaled size.
export function frameStyle(
  frame: Rect,
  sheet: { w: number; h: number },
  scale: number,
) {
  return {
    width: `${frame.w * scale}px`,
    height: `${frame.h * scale}px`,
    backgroundSize: `${sheet.w * scale}px ${sheet.h * scale}px`,
    backgroundPosition: `${-frame.x * scale}px ${-frame.y * scale}px`,
  }
}

// The sheet image's URL. The manifest's paths are relative to public/, which
// Vite serves at BASE_URL (the site root here).
export function sheetUrl(name: SpriteName): string {
  return `${import.meta.env.BASE_URL}${TEXTURES[SPRITES[name].texture].image}`
}

// The atlas is fetched once and shared: every caller gets the same promise,
// so the inventory and the goal panel don't each download it.
let atlasPromise: Promise<Atlas> | null = null

export function loadAtlas(): Promise<Atlas> {
  if (atlasPromise === null) {
    const url = `${import.meta.env.BASE_URL}${TEXTURES.dungeon.atlas}`
    atlasPromise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${url}`)
        return response.json()
      })
      .then((json) => atlasSchema.parse(json))
    // A failed fetch isn't kept, so the next caller tries again.
    atlasPromise.catch(() => {
      atlasPromise = null
    })
  }
  return atlasPromise
}
