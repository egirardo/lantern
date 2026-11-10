// Small pure helpers for animating sprites. They decide things about the
// picture only (which way a sprite faces, whether a move should slide), never
// game rules, so they live next to the Phaser code. They import nothing from
// Phaser, so Vitest can test them without a canvas.

import type { Position } from '../game/movement'

// Which way a sprite looks. The art faces right, so 'left' means "flip it".
// There is no up or down: the sheet only has side views.
export type Facing = 'left' | 'right'

// The key a Phaser animation is stored under, made from the logical sprite
// name and the animation name in the manifest, e.g. 'skeleton' + 'idle' ->
// 'skeleton-idle'. Built in one place so the code that creates the animations
// and the code that plays them can never disagree on the spelling (rule 7: the
// key comes from logical names, never from file paths).
export function animationKey(
  spriteName: string,
  animationName: string,
): string {
  return `${spriteName}-${animationName}`
}

// The way the sprite should face after moving from `from` to `to`. Moving
// east faces right and moving west faces left. Moving north or south (or not
// moving at all) keeps the current facing, because the art has no front or
// back view, and turning on every vertical step would look like twitching.
export function facingAfterStep(
  from: Position,
  to: Position,
  current: Facing,
): Facing {
  if (to.x > from.x) return 'right'
  if (to.x < from.x) return 'left'
  return current
}

// True when `to` is exactly one tile north, south, east or west of `from`:
// a normal step, which is worth sliding. Anything else (the same tile after a
// blocked move, or a jump across the room) should just snap to the new tile,
// because sliding across walls would look like the player walked through them.
export function isSingleStep(from: Position, to: Position): boolean {
  const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
  return distance === 1
}

// Which animation from the manifest an enemy's sprite should play: 'unmasked'
// for an enemy that has dropped its disguise (the mimic, once a fight with it
// has started), otherwise 'idle'. Only sprites that have an 'unmasked'
// animation can use it, so a skeleton (never disguised) always gets 'idle'.
// The scene doesn't decide when the mimic is unmasked: the store does, by
// removing `disguise` from the enemy (rule 3), and this only reads that.
// Object.hasOwn instead of `in`, so names every object inherits don't count.
export function enemyAnimationName(
  isDisguised: boolean,
  animations: object,
): 'idle' | 'unmasked' {
  return !isDisguised && Object.hasOwn(animations, 'unmasked')
    ? 'unmasked'
    : 'idle'
}
