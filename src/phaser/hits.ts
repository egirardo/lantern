// Pure helpers that work out who was just hit, by comparing the store's state
// before and after an update. Phaser doesn't decide who was hit (rule 3): the
// combat code in src/game/ has already changed the health in the store, and
// these helpers only read that change so the scene can show a flash.
// No Phaser imports, so Vitest can test them without a canvas.

// The only part of an enemy these helpers need. StoreEnemy fits this shape,
// and the tests can pass small objects without a full combatant.
type EnemyHealth = { id: string; combatant: { currentHealth: number } }

// True when health went down: that is a hit. Health going up (recovering
// after a fight, or the full heal at an exit) or staying the same is not.
export function wasHit(previousHealth: number, currentHealth: number): boolean {
  return currentHealth < previousHealth
}

// The enemies (from the current list) whose health went down between two
// enemy lists.
// An enemy that is only in one of the lists is skipped: a new enemy (a new
// room) wasn't hit, and a defeated enemy has already been removed from the
// store, so its sprite is gone too and there is nothing to flash.
//
// <Enemy extends EnemyHealth> is a generic: whatever kind of enemy goes in
// (in the game, StoreEnemy with its type and position) comes back out, so
// the caller can still read enemy.type from the result.
export function hitEnemies<Enemy extends EnemyHealth>(
  previousEnemies: readonly EnemyHealth[],
  currentEnemies: readonly Enemy[],
): Enemy[] {
  // A Map from id to health, so each enemy is found in one step instead of
  // searching the whole previous list for every current enemy.
  const previousHealth = new Map(
    previousEnemies.map((enemy) => [enemy.id, enemy.combatant.currentHealth]),
  )
  return currentEnemies.filter((enemy) => {
    const before = previousHealth.get(enemy.id)
    return before !== undefined && wasHit(before, enemy.combatant.currentHealth)
  })
}
