import type { Combatant, CombatState } from './combat'
import type { StoreEnemy } from './spawn-enemies'

// After every combat step, the store's player and enemies are brought up to
// date from the combat state, so health only has one source of truth
// (rule 2). Like a warehouse list updated from a delivery report:
// - an enemy in the combat gets its new combatant, but keeps its own id,
//   type and position, which the combat doesn't know about
// - an enemy at 0 health is removed, so it stops blocking movement
//   (it stays in `combat.enemies`, so narration can still find its name)
// - an enemy that isn't in the combat (it wasn't adjacent when the fight
//   started) is kept exactly as it was
// Returns new objects and never changes its inputs.
export function syncFromCombat(
  enemies: StoreEnemy[],
  combat: CombatState,
): { player: Combatant; enemies: StoreEnemy[] } {
  const updatedEnemies = enemies
    .map((enemy) => {
      // The same lookup by id as getName in narration.ts.
      const entry = combat.enemies.find((e) => e.id === enemy.id)
      if (!entry) {
        // Not in this fight: return the same object untouched.
        return enemy
      }
      // A new object with every field of the store enemy, but the
      // combatant replaced by the one from the combat.
      return { ...enemy, combatant: entry.combatant }
    })
    // Runs after the update, so it sees the new health values.
    .filter((enemy) => enemy.combatant.currentHealth > 0)

  // The player needs no merging: the store's player and the combat's player
  // are the same Combatant type, and during a fight the combat is the truth.
  return { player: combat.player, enemies: updatedEnemies }
}
