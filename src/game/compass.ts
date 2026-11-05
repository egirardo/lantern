import type { Position } from './movement'

// The 8 compass directions the narration can use. A union of string literals:
// TypeScript only accepts these exact strings, so a typo like 'south east'
// is a type error instead of a strange log line.
export type CompassDirection =
  | 'north'
  | 'north-east'
  | 'east'
  | 'south-east'
  | 'south'
  | 'south-west'
  | 'west'
  | 'north-west'

// The direction from one tile to another, as the player would describe it.
// - y grows downward on the grid (row 0 is the top), so a smaller y is north.
// - If one axis is at least twice the other, the direction is straight:
//   2 east and 1 north is "east". Otherwise it's a diagonal: 3 east and 2
//   south is "south-east". "At least" (>=) means exactly twice counts as
//   straight.
// - The same tile has no direction, so it throws. The store should never ask
//   for it, so a throw makes that bug show up instead of hiding it.
export function directionFrom(from: Position, to: Position): CompassDirection {
  const dx = to.x - from.x
  const dy = to.y - from.y

  // This check must come first: with dx = dy = 0, the straight checks below
  // would also be true (0 >= 2 * 0) and return 'west'.
  if (dx === 0 && dy === 0) {
    throw new Error('Cannot determine direction to the same position')
  }

  // Each axis on its own: which way, ignoring the other axis.
  const vertical = dy < 0 ? 'north' : 'south'
  const horizontal = dx > 0 ? 'east' : 'west'

  // Math.abs, because only the distance matters for the "twice" rule, not
  // which way it points.
  const distanceX = Math.abs(dx)
  const distanceY = Math.abs(dy)

  if (distanceX >= 2 * distanceY) return horizontal
  if (distanceY >= 2 * distanceX) return vertical

  // A template literal builds 'south-east' from 'south' and 'east'. TypeScript
  // works out that the result is one of the four diagonals, so it matches
  // CompassDirection without a cast.
  return `${vertical}-${horizontal}`
}
