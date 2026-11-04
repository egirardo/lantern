import type { Position } from './movement'
import type { StoreEnemy } from './spawn-enemies'

export function getAdjacentEnemies(
  position: Position,
  enemies: readonly StoreEnemy[],
): StoreEnemy[] {
  return enemies.filter((enemy) => {
    const dx = Math.abs(enemy.position.x - position.x)
    const dy = Math.abs(enemy.position.y - position.y)
    // Adjacent means exactly one step up, down, left or right, so the two distances add up to 1. A diagonal adds up to 2 and the same tile to 0.
    return dx + dy === 1
  })
}
