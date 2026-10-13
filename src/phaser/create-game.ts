import Phaser from 'phaser'

const TILE_SIZE = 16

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: TILE_SIZE * 12,
    height: TILE_SIZE * 10,
    zoom: 3,
    // Keeps 16×16 pixel art sharp when scaled up, instead of blurring it.
    pixelArt: true,
    backgroundColor: '#000000',
    // Scenes are added in Phase E.
    scene: [],
  })
}
