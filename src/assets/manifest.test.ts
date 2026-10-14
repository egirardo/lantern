import { describe, it, expect } from 'vitest'
import { SPRITES } from './manifest'
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
})
