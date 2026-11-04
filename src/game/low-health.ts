import type { Combatant } from './combat'

// The health at or below which a combatant counts as "low", a quarter of max
// health rounded down (12 → 3, 11 → 2). Exported so the store and the tests
// use the same number instead of each computing their own.
export function lowHealthThreshold(maxHealth: number): number {
  return Math.floor(maxHealth / 4)
}

// True only on the hit that takes a combatant from above the threshold to at
// or below it, like a phone's "battery low" warning that fires once at 20%
// and not again at 19%. A killing blow doesn't count: at 0 the "defeated"
// line already tells the player, so a low-health warning would be noise.
export function crossedLowHealth(before: Combatant, after: Combatant): boolean {
  const threshold = lowHealthThreshold(after.maxHealth)
  const wasAbove = before.currentHealth > threshold
  const isLow = after.currentHealth <= threshold
  const isAlive = after.currentHealth > 0
  return wasAbove && isLow && isAlive
}
