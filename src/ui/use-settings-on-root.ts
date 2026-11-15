import { useLayoutEffect } from 'react'
import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { TEXT_SCALES } from '../state/settings'

// Puts the two settings that CSS needs on the root element (<html>), so every
// screen follows them at once, even the book dialog (it's in the top layer,
// but still inside <html>):
// - data-contrast="high" turns the skin off (see high-contrast.css);
// - --text-scale multiplies the root font size, and every size in rem
//   follows it (see base.css).
// The store is the one source of truth (rule 2): this only copies values
// from it to the page, it never keeps settings of its own.
//
// useLayoutEffect instead of useEffect: it runs before the browser paints,
// so the first frame is already in the player's text size and contrast,
// with no flash of the default look.
export function useSettingsOnRoot() {
  // Two selectors returning plain values, so this only re-renders when one
  // of these two settings changes, not on every step in the game.
  const highContrast = useStore(gameStore, (s) => s.settings.highContrast)
  const textSize = useStore(gameStore, (s) => s.settings.textSize)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.dataset.contrast = 'high'
    } else {
      // Removing the attribute (not setting "normal") keeps the CSS simple:
      // only [data-contrast='high'] has rules.
      delete root.dataset.contrast
    }
  }, [highContrast])

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      '--text-scale',
      String(TEXT_SCALES[textSize]),
    )
  }, [textSize])
}
