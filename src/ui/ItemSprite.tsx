import { useEffect, useState, type CSSProperties } from 'react'
import {
  SPRITE_SCALE,
  frameStyle,
  isSpriteName,
  loadAtlas,
  sheetUrl,
  stillFrameName,
} from './sprite-frame'

// One item's sprite from the game's own sheet, at 3× (48 px), e.g. the gold
// key in Inventory and Goal. Looked up by its logical name through the asset
// manifest (rule 7). Decoration only: the item's name is always written next
// to it, so it's aria-hidden, like an <img alt="">.
//
// A <span> with a background instead of an <img>, because the frame is a
// small part of one big image (see sprite-frame.ts).
export function ItemSprite({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  // The style for the frame, once the atlas has loaded. Until then the box
  // has its size from CSS (.item-sprite) and no picture, so nothing around
  // it moves when the picture arrives.
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useEffect(() => {
    if (!isSpriteName(type)) return
    // Set when the component unmounts before the fetch finishes, so it
    // doesn't set state on a component that's gone (the same idea as
    // `ignore` in RoomLoader).
    let ignore = false
    loadAtlas()
      .then((atlas) => {
        const entry = atlas.frames[stillFrameName(type)]
        if (ignore || !entry) return
        setStyle({
          backgroundImage: `url("${sheetUrl(type)}")`,
          ...frameStyle(entry.frame, atlas.meta.size, SPRITE_SCALE),
        })
      })
      // The sprite is decoration: without it, the item's name still says
      // everything, so a failed load is only a warning.
      .catch((error) => console.warn('Could not load the sprite atlas', error))
    return () => {
      ignore = true
    }
  }, [type])

  return (
    <span
      className={className ? `item-sprite ${className}` : 'item-sprite'}
      style={style ?? undefined}
      aria-hidden="true"
    />
  )
}
