import Phaser from 'phaser'
import { TEXTURES, TILESETS, SPRITES } from '../assets/manifest'
import type { TiledMap } from '../rooms/tiled-schema'
import { toTileIndices } from '../rooms/tile-indices'
import { gameStore } from '../state/game-store'
import type { Position } from '../game/movement'

export class RoomScene extends Phaser.Scene {
  private playerSprite?: Phaser.GameObjects.Sprite
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
    const { tiledMap, playerPosition } = gameStore.getState()
    if (tiledMap) {
      this.drawRoom(tiledMap)
      if (playerPosition) {
        this.drawPlayer(playerPosition)
      }
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
    this.playerSprite = sprite
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
