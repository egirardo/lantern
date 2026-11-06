// The one place that decides whether sprites may move on their own (idle
// loops, walking frames and sliding between tiles). Every animation asks this
// function right before it starts, so there is a single switch to change.
//
// For now it reads the operating system's "Reduce motion" setting through the
// prefers-reduced-motion media query. matchMedia is asked again on every call
// (not once at start-up), so turning the setting on or off takes effect on the
// player's next step, without reloading the page.
//
// Phase L: replace the body with the player's own setting from the store
// (which should itself start from this media query), and keep the name, so
// the Phaser code doesn't have to change.
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
