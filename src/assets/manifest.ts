// The asset manifest: the only place that knows where art files live.
// Game code and room files refer to art by logical name (e.g. 'hero-girl'),
// never by file path (CLAUDE.md, architecture rule 7). Swapping in new art,
// like custom Aseprite sprites, means changing this file and nothing else.
//
// This file is plain data with no Phaser imports, so any part of the code
// can read the names. Phaser's preload step reads it to load the files.

// Image files and their atlases. Paths are relative to public/, which Vite
// serves at the site root.
export const TEXTURES = {
  dungeon: {
    image: 'assets/dungeon/dungeontileset-extended.png',
    // Lists the name, position and size of each sprite frame on the image.
    atlas: 'assets/dungeon/sprites.json',
  },
} as const

export type TextureName = keyof typeof TEXTURES

// Tilesets used by Tiled maps. The name must match the tileset name in Tiled.
export const TILESETS = {
  dungeon: {
    image: TEXTURES.dungeon.image,
    tileWidth: 16,
    tileHeight: 16,
  },
} as const

export type TilesetName = keyof typeof TILESETS

type AnimationDefinition = {
  // Frame numbers, combined with the sprite's frame prefix to get atlas
  // frame names. For example, 'hero-girl-' + 4 = 'hero-girl-4'.
  frames: readonly number[]
  // Frames per second.
  frameRate: number
  // -1 loops forever, 0 plays once.
  repeat: number
}

type SpriteDefinition = {
  texture: TextureName
  framePrefix: string
  animations: Record<string, AnimationDefinition>
}

// Animations shared by both heroes, since their rows on the sheet have the
// same layout: frames 0–3 idle, 4–7 run, 8 hit.
const HERO_ANIMATIONS = {
  idle: { frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  run: { frames: [4, 5, 6, 7], frameRate: 10, repeat: -1 },
  hit: { frames: [8], frameRate: 1, repeat: 0 },
} as const

// Characters, enemies and items, by logical name (kebab-case).
export const SPRITES = {
  'hero-girl': {
    texture: 'dungeon',
    framePrefix: 'hero-girl-',
    animations: HERO_ANIMATIONS,
  },
  'hero-boy': {
    texture: 'dungeon',
    framePrefix: 'hero-boy-',
    animations: HERO_ANIMATIONS,
  },
} as const satisfies Record<string, SpriteDefinition>

export type SpriteName = keyof typeof SPRITES
