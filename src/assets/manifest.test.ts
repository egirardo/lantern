import { describe, it, expect } from 'vitest'
import { SPRITES, TILESETS } from './manifest'
import dungeonAtlas from '../../public/assets/dungeon/sprites.json'

// Each texture's atlas, so the test can look up frame names per texture.
const atlases = {
  dungeon: dungeonAtlas,
}

describe('asset manifest', () => {
  // Catches typos and wrong frame numbers when sprites are added: a missing
  // frame would otherwise only show up as a broken sprite in the browser.
  it('only refers to frames that exist in the atlas', () => {
    const missingFrames: string[] = []

    for (const [spriteName, sprite] of Object.entries(SPRITES)) {
      const atlasFrameNames = Object.keys(atlases[sprite.texture].frames)

      for (const animation of Object.values(sprite.animations)) {
        for (const frameNumber of animation.frames) {
          const frameName = `${sprite.framePrefix}${frameNumber}`
          if (!atlasFrameNames.includes(frameName)) {
            missingFrames.push(`${spriteName}: ${frameName}`)
          }
        }
      }
    }

    // Comparing to an empty list makes the test output show exactly which frames are missing.
    expect(missingFrames).toEqual([])
  })

  // A tileset has no frame names: Phaser cuts the whole image into a grid of
  // tileWidth × tileHeight tiles. If the image size isn't a whole number of
  // tiles, the grid is cut wrong and every tile after the first row is offset.
  it('cuts every tileset image into whole tiles', () => {
    const badTilesets: string[] = []

    for (const [tilesetName, tileset] of Object.entries(TILESETS)) {
      // The atlas JSON records the size of its image under meta.size.
      const { w, h } = atlases[tileset.texture].meta.size

      if (w % tileset.tileWidth !== 0 || h % tileset.tileHeight !== 0) {
        badTilesets.push(
          `${tilesetName}: ${w}×${h} image, ${tileset.tileWidth}×${tileset.tileHeight} tiles`,
        )
      }
    }

    expect(badTilesets).toEqual([])
  })
})
