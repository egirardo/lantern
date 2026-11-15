import type { Combatant } from './combat'

// How much health the player gets back after winning a fight (decided Nov 2).
// Fixed instead of rolled, so the player can plan and the tests are exact.
// Exported so combat-flow.ts and the tests use the same number.
export const RECOVERY_AMOUNT = 4

// Returns a copy of `combatant` with `amount` added to its current health,
// never above max health. The amount is a parameter, not RECOVERY_AMOUNT,
// so a full heal on a room change (planned for Fri Nov 6) can reuse it by
// passing `combatant.maxHealth`.
export function recoverHealth(combatant: Combatant, amount: number): Combatant {
  // Math.min picks the smaller number: the healed health, or the cap.
  const currentHealth = Math.min(
    combatant.currentHealth + amount,
    combatant.maxHealth,
  )

  // The spread `...combatant` copies every field into a new object, and the
  // `currentHealth` after it replaces just that one. The input is never
  // changed, which is what the "does not change its input" test checks.
  return { ...combatant, currentHealth }
}

// Returns a copy of `combatant` at full health. Used when the player goes
// through an exit (decided Nov 3): adding maxHealth always reaches the cap,
// so this reuses recoverHealth instead of a second healing rule.
export function healFully(combatant: Combatant): Combatant {
  return recoverHealth(combatant, combatant.maxHealth)
}
