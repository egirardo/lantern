import Phaser from 'phaser'
import {
  TEXTURES,
  TILESETS,
  SPRITES,
  type SpriteName,
} from '../assets/manifest'
import type { TiledMap } from '../rooms/tiled-schema'
import { toTileIndices } from '../rooms/tile-indices'
import { gameStore, type GameState } from '../state/game-store'
import type { Grid, Position } from '../game/movement'
import type { StoreEnemy } from '../game/spawn-enemies'
import { getVisibleTiles, isLit, LANTERN_RADIUS } from '../game/visibility'

// Depth decides what is drawn on top: a higher depth covers a lower one. The
// tilemap layers keep the default depth 0. The dark goes over the tiles, and
// enemies and the player go over the dark. Without depths, the order would
// depend on what happened to be created last, which changes as the game runs
// (enemy sprites are made again on every move).
const DARKNESS_DEPTH = 1
const ENEMY_DEPTH = 2
const PLAYER_DEPTH = 3

// Fully black, the same colour as the game's background (create-game.ts), so a
// dark tile looks exactly like the empty space around the room.
const DARKNESS_COLOR = 0x000000

// Enemy types are plain strings in the store, but SPRITES only has keys for the
// sprites in the manifest. This type guard checks at runtime that the name
// exists, and tells TypeScript that `name` is a SpriteName after the check.
// Object.hasOwn instead of `name in SPRITES`, because `in` also finds names
// every object inherits, like 'toString'.
function isSpriteName(name: string): name is SpriteName {
  return Object.hasOwn(SPRITES, name)
}

export class RoomScene extends Phaser.Scene {
  private playerSprite?: Phaser.GameObjects.Sprite
  // One Graphics object that paints a black square over every unlit tile. It
  // is cleared and painted again whenever the light changes.
  private darkness?: Phaser.GameObjects.Graphics
  // The enemy sprites currently on screen: only the lit enemies. They are
  // Phaser objects, not game state: where the enemies are and who is alive is
  // always read from the store.
  private enemySprites: Phaser.GameObjects.Sprite[] = []
  private readonly PLAYER_SPRITE = 'hero-girl'
  // Width and height of one tile in pixels. Set in drawRoom from the map, so
  // drawPlayer and the move code share one value instead of passing it around.
  // It stays 0 until a room is drawn, and drawRoom always runs before drawPlayer.
  private tileSize = 0

  constructor() {
    super({ key: 'room' })
  }

  preload() {
    for (const [name, texture] of Object.entries(TEXTURES)) {
      this.load.atlas(name, texture.image, texture.atlas)
    }
  }

  create() {
    // A Graphics object draws shapes (here squares) instead of images. Made
    // once, here, and redrawn later, so there is only ever one layer of dark.
    this.darkness = this.add.graphics()
    this.darkness.setDepth(DARKNESS_DEPTH)

    // The room may already be in the store (if it loaded before the scene started)
    const state = gameStore.getState()
    if (state.tiledMap) {
      this.drawRoom(state.tiledMap)
      if (state.playerPosition) {
        this.drawPlayer(state.playerPosition)
      }
      this.drawLight(state)
    }

    const unsubscribe = gameStore.subscribe((state, previousState) => {
      // 1. The room has just loaded: draw it, then the player on top
      if (state.tiledMap !== previousState.tiledMap && state.tiledMap) {
        this.drawRoom(state.tiledMap)
        if (state.playerPosition) {
          this.drawPlayer(state.playerPosition)
        }
      }

      // 2. The player has moved: move the existing sprite. This is a separate
      // check (not nested in the one above) because after the room has loaded,
      // tiledMap never changes again, but playerPosition does.
      if (
        state.playerPosition !== previousState.playerPosition &&
        state.playerPosition
      ) {
        // ?. does nothing if the sprite doesn't exist yet
        const { x, y } = this.tileToSpritePosition(state.playerPosition)
        this.playerSprite?.setPosition(x, y)
      }

      // 3. The light: redraw the dark and the enemies when the room loads, the
      // player moves (the light moves with them), or the enemies change (one
      // was defeated and removed from the store, so its sprite must go too).
      if (
        state.tiledMap !== previousState.tiledMap ||
        state.playerPosition !== previousState.playerPosition ||
        state.enemies !== previousState.enemies
      ) {
        this.drawLight(state)
      }
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe)
    this.events.once(Phaser.Scenes.Events.DESTROY, unsubscribe)
  }

  private drawRoom(tiledMap: TiledMap) {
    this.tileSize = tiledMap.tilewidth

    // 1. An empty map with the right size
    const map = this.make.tilemap({
      width: tiledMap.width,
      height: tiledMap.height,
      tileWidth: tiledMap.tilewidth,
      tileHeight: tiledMap.tileheight,
    })

    // 2. The Tiled tileset info (name + firstgid)
    const tiledTileset = tiledMap.tilesets[0]
    if (!tiledTileset) {
      throw new Error('No tileset found in Tiled map')
    }

    // 3. A Phaser tileset made from that texture
    const phaserTileset = map.addTilesetImage(
      tiledTileset.name,
      TILESETS[tiledTileset.name].texture,
    )
    if (!phaserTileset) {
      throw new Error(
        `Failed to create Phaser tileset for ${tiledTileset.name}`,
      )
    }

    // 4. One Phaser layer per Tiled layer, filled with tiles
    for (const tiledLayer of tiledMap.layers) {
      // a) make an empty Phaser layer
      const phaserLayer = map.createBlankLayer(tiledLayer.name, phaserTileset)
      if (!phaserLayer) {
        throw new Error(`Failed to create Phaser layer for ${tiledLayer.name}`)
      }
      // b) fill it with tiles
      const tileIndices = toTileIndices(
        tiledLayer.data,
        tiledMap.width,
        tiledTileset.firstgid,
      )
      phaserLayer.putTilesAt(tileIndices, 0, 0)
    }
  }

  private drawPlayer(position: Position) {
    const hero = SPRITES[this.PLAYER_SPRITE]
    const { x, y } = this.tileToSpritePosition(position)
    const sprite = this.add.sprite(
      x,
      y,
      hero.texture,
      `${hero.framePrefix}0`, // start with the first frame
    )
    // The hero frame is 16×32, twice as tall as a tile. Anchor it at the
    // bottom centre (its feet), so tileToSpritePosition can place the feet in
    // the middle of the tile and let the head stick up into the tile above.
    sprite.setOrigin(0.5, 1)
    // The player is always visible, so they go above the dark.
    sprite.setDepth(PLAYER_DEPTH)
    this.playerSprite = sprite
  }

  // Everything that depends on where the lantern shines. The store decides
  // what is where; this method only asks getVisibleTiles which tiles are lit
  // and draws the result (rule 3: no game rules in Phaser code).
  private drawLight(state: GameState) {
    const { grid, playerPosition, enemies } = state
    // No room loaded yet, so there is nothing to light.
    if (grid === null || playerPosition === null) return

    const visibleTiles = getVisibleTiles(grid, playerPosition, LANTERN_RADIUS)
    this.drawDarkness(grid, visibleTiles)
    this.drawEnemies(enemies, visibleTiles)
  }

  // Paints a black square over every tile the lantern doesn't reach.
  private drawDarkness(grid: Grid, visibleTiles: Position[]) {
    const darkness = this.darkness
    if (!darkness) return

    // clear() wipes everything drawn before, so the old dark (around the
    // player's previous tile) doesn't stay on screen.
    darkness.clear()
    // fillStyle sets the colour (and opacity, 1 = solid) for the fillRect
    // calls after it, like picking up a paintbrush.
    darkness.fillStyle(DARKNESS_COLOR, 1)

    for (const [y, row] of grid.entries()) {
      for (let x = 0; x < row.length; x++) {
        if (!isLit(visibleTiles, { x, y })) {
          // A tile's pixel position is its top-left corner: tile x times the
          // tile size. (Sprites use tileToSpritePosition instead, because their
          // origin is at their feet.)
          darkness.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize,
          )
        }
      }
    }
  }

  // Draws a sprite for every enemy on a lit tile, and none for the others.
  // The simplest way to keep the screen in step with the store: throw away
  // all the old sprites and make new ones from the current enemy list. A
  // defeated enemy is no longer in the list, so it gets no new sprite.
  private drawEnemies(enemies: StoreEnemy[], visibleTiles: Position[]) {
    // destroy() removes a sprite from the scene and frees it. Only hiding it
    // would leave a pile of invisible sprites behind after every move.
    for (const sprite of this.enemySprites) {
      sprite.destroy()
    }
    this.enemySprites = []

    for (const enemy of enemies) {
      if (!isLit(visibleTiles, enemy.position)) continue

      // Rule 7: the sprite is found by its logical name (the enemy type, e.g.
      // 'demon'), never by a file path.
      if (!isSpriteName(enemy.type)) {
        throw new Error(`No sprite in the asset manifest for ${enemy.type}`)
      }
      const art = SPRITES[enemy.type]
      const { x, y } = this.tileToSpritePosition(enemy.position)
      const sprite = this.add.sprite(
        x,
        y,
        art.texture,
        // The first idle frame, standing still. Animations wait until the
        // reduced motion setting exists.
        `${art.framePrefix}${art.animations.idle.frames[0]}`,
      )
      // Enemy frames are 16×32 like the hero's, so they use the same
      // bottom-centre origin (see drawPlayer).
      sprite.setOrigin(0.5, 1)
      sprite.setDepth(ENEMY_DEPTH)
      this.enemySprites.push(sprite)
    }
  }

  // Tile position -> where the sprite's anchor (bottom centre, its feet) goes in
  // pixels: the middle of the tile both ways, so the feet stand in the centre of
  // the tile. With the default centred origin, a 32px-tall sprite would hang
  // half a tile too low.
  private tileToSpritePosition(position: Position): { x: number; y: number } {
    return {
      x: position.x * this.tileSize + this.tileSize / 2,
      y: position.y * this.tileSize + this.tileSize / 2,
    }
  }
}
