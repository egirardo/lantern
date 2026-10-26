import Phaser from 'phaser'
import { TEXTURES, TILESETS } from '../assets/manifest'
import type { TiledMap } from '../rooms/tiled-schema'
import { toTileIndices } from '../rooms/tile-indices'
import { gameStore } from '../state/game-store'

export class RoomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'room' })
  }

  preload() {
    for (const [name, texture] of Object.entries(TEXTURES)) {
      this.load.atlas(name, texture.image, texture.atlas)
    }
  }

  create() {
    this.add.image(0, 0, 'dungeon', 'hero-boy-0').setOrigin(0, 0) //this line is temporary, remove in step 4
    const tiledMap = gameStore.getState().tiledMap
    if (tiledMap) {
      this.drawRoom(tiledMap)
    } else {
        console.log('No Tiled map found in game store')
    }
  }

  private drawRoom(tiledMap: TiledMap) {
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
}
