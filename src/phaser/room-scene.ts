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
import type { Position } from '../game/movement'
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

// The name the dark image is stored under in Phaser's texture manager.
const DARKNESS_TEXTURE = 'lantern-darkness'

// Where the soft edge of the light starts and ends, in tiles from the centre
// of the player's tile. The picture must agree with the rule in
// getVisibleTiles (a tile is lit when its centre is within LANTERN_RADIUS):
// - Fully clear up to half a tile inside the radius. Lit tiles straight out
//   (2 tiles away) are fully clear in the middle, and the lit tiles at
//   (±2, ±1), about 2.24 tiles away, are only about a quarter dark there.
// - Fully black from half a tile outside the radius, so unlit tiles are
//   mostly or fully dark (the (±2, ±2) corners, about 2.83 away, are about
//   83% dark in the middle; tiles 3 or more away are solid black).
// - In between it fades, so the edge looks like lantern light, not squares.
// Enemies don't use the picture at all: they are shown only when isLit says
// their tile is lit, so a half-dark edge tile can never hide or show one wrongly.
const LIGHT_CLEAR_RADIUS = LANTERN_RADIUS - 0.5
const LIGHT_DARK_RADIUS = LANTERN_RADIUS + 0.5

// Enemy types are plain strings in the store, but SPRITES only has keys for the
// sprites in the manifest. This type guard checks at runtime that the name
// exists, and tells TypeScript that `name` is a SpriteName after the check.
// Object.hasOwn instead of `name in SPRITES`, because `in` also finds names
// every object inherits, like 'toString'.
function isSpriteName(name: string): name is SpriteName {
  return Object.hasOwn(SPRITES, name)
}

export class RoomScene extends Phaser.Scene {
  // The tilemap of the room on screen. Kept so it can be destroyed (with all
  // its layers) when the player goes through an exit to another room.
  private map?: Phaser.Tilemaps.Tilemap
  private playerSprite?: Phaser.GameObjects.Sprite
  // One big black image with a soft round hole in the middle. It is made when
  // the room is drawn and moved so the hole is always over the player.
  private darkness?: Phaser.GameObjects.Image
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
      // 1. A room has just loaded (the first one, or the next one after an
      // exit): throw away everything from the old room, then draw the new
      // room and the player on top.
      if (state.tiledMap !== previousState.tiledMap && state.tiledMap) {
        this.clearRoom()
        this.drawRoom(state.tiledMap)
        if (state.playerPosition) {
          this.drawPlayer(state.playerPosition)
        }
      }

      // 2. The player has moved: move the existing sprite. This is a separate
      // check (not nested in the one above) because tiledMap only changes when
      // a room loads, but playerPosition changes on every step.
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

  // Removes everything the old room put in the scene, before the next room is
  // drawn. Without this, the new tiles would be drawn on top of the old ones,
  // and the old player sprite would stay behind where the player used to be.
  // destroy() removes a game object from the scene and frees it. `?.` skips
  // what doesn't exist yet (on the first room there's nothing to clear).
  private clearRoom() {
    // Destroying the tilemap also destroys all of its layers.
    this.map?.destroy()
    this.map = undefined
    this.playerSprite?.destroy()
    this.playerSprite = undefined
    for (const sprite of this.enemySprites) {
      sprite.destroy()
    }
    this.enemySprites = []
    // The dark's texture is removed in createDarkness, which runs next.
    this.darkness?.destroy()
    this.darkness = undefined
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
    // Kept so clearRoom can destroy it when the next room loads.
    this.map = map

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

    // 5. The dark over the tiles. Its size depends on the map, so it's made here.
    this.createDarkness(
      tiledMap.width * tiledMap.tilewidth,
      tiledMap.height * tiledMap.tileheight,
    )
  }

  // Makes the dark: a texture painted with the browser's canvas drawing API,
  // and one Image that shows it. A texture is the picture itself (stored once in
  // the texture manager); an Image is a game object that shows a texture at a
  // position. drawLight only moves the Image, so the picture is painted once.
  private createDarkness(mapWidth: number, mapHeight: number) {
    // Twice the map's size in both directions. The hole is in the middle, so
    // even with the player in a corner, the image still reaches past the
    // opposite corner and covers the whole map.
    const width = mapWidth * 2
    const height = mapHeight * 2

    // If a room was drawn before, throw away its dark. Texture keys must be
    // unique, so createCanvas returns null if the key is still in use. Making
    // it again (instead of reusing it) is simplest, because a new room can
    // have a different size. The Image goes first, since it uses the texture.
    this.darkness?.destroy()
    if (this.textures.exists(DARKNESS_TEXTURE)) {
      this.textures.remove(DARKNESS_TEXTURE)
    }

    // A canvas texture is a blank <canvas> that Phaser uses as a texture. We
    // paint on it with the normal CanvasRenderingContext2D, like on any canvas.
    const texture = this.textures.createCanvas(DARKNESS_TEXTURE, width, height)
    if (!texture) {
      throw new Error('Failed to create the darkness texture')
    }
    const context = texture.getContext()

    // A radial gradient blends colours outwards from a centre point. It goes
    // from a circle of radius 0 to one of radius LIGHT_DARK_RADIUS, both at
    // the middle of the texture. The colour stops are fractions of that
    // distance (0 = centre, 1 = the outer circle). Past the outer circle the
    // last colour, solid black, carries on to the edges.
    const centerX = width / 2
    const centerY = height / 2
    const darkRadius = LIGHT_DARK_RADIUS * this.tileSize
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      darkRadius,
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)') // see-through
    gradient.addColorStop(
      LIGHT_CLEAR_RADIUS / LIGHT_DARK_RADIUS,
      'rgba(0, 0, 0, 0)', // still see-through: the fade starts here
    )
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)') // solid black
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    // Painting on the canvas doesn't reach the screen by itself. refresh()
    // sends the new pixels to the GPU (WebGL), so Phaser can draw them.
    texture.refresh()

    // An Image's origin is its centre by default, so placing it at a point
    // puts the middle of the hole exactly on that point.
    this.darkness = this.add.image(0, 0, DARKNESS_TEXTURE)
    this.darkness.setDepth(DARKNESS_DEPTH)
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

    // Move the hole to the player. setPosition jumps straight there, with no
    // sliding animation (that would need a tween and the reduced motion setting).
    const { x, y } = this.tileCenter(playerPosition)
    this.darkness?.setPosition(x, y)

    const visibleTiles = getVisibleTiles(grid, playerPosition, LANTERN_RADIUS)
    this.drawEnemies(enemies, visibleTiles)
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

  // Tile position -> the pixel at the middle of that tile. A tile starts at its
  // top-left corner (tile x times the tile size), so the middle is half a tile
  // further. The light is measured from the middle of the player's tile, like
  // the rule in getVisibleTiles. This gives the same numbers as
  // tileToSpritePosition below, but means something else: that one is where a
  // sprite's feet go, this one is the centre of the tile itself.
  private tileCenter(position: Position): { x: number; y: number } {
    return {
      x: position.x * this.tileSize + this.tileSize / 2,
      y: position.y * this.tileSize + this.tileSize / 2,
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
