import Phaser from 'phaser'
import { TEXTURES } from '../assets/manifest'

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
  }
}
