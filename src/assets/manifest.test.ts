import { describe, it, expect } from 'vitest'
import { SPRITES, TILESETS } from './manifest'
import dungeonAtlas from '../../public/assets/dungeon/sprites.json'
import enemiesData from '../game/enemies.json'
import itemsData from '../game/items.json'

// Each texture's atlas, so the test can look up frame names per texture.
const atlases = {
  dungeon: dungeonAtlas,
}

// The types (keys of enemies.json or items.json) that have no sprite of the
// same name in the manifest. Game code looks a sprite up by the type's name
// (rule 7: art by logical name), so a type without one would have nothing to
// draw. Object.hasOwn instead of `in`, so names like 'toString' that every
// object inherits don't count as sprites.
function typesWithoutSprite(types: string[]): string[] {
  return types.filter((type) => !Object.hasOwn(SPRITES, type))
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

  // Catches an enemy added to enemies.json without art: it would fight and be
  // narrated in the log, but be invisible on the canvas.
  it('has a sprite for every enemy type', () => {
    const enemyTypes = Object.keys(enemiesData)

    // Comparing to an empty list makes the test output name the missing types.
    expect(typesWithoutSprite(enemyTypes)).toEqual([])
  })

  // Skipped for now: no item has a sprite yet (rusty-key has none), because
  // items aren't drawn on the canvas yet. Agent E (items and inventory) must
  // add the item sprites to SPRITES when it draws items, and then turn this
  // test on by changing `it.skip` to `it`.
  it.skip('has a sprite for every item type', () => {
    const itemTypes = Object.keys(itemsData)

    expect(typesWithoutSprite(itemTypes)).toEqual([])
  })
})
