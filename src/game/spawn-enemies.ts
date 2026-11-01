import type { Combatant } from './combat'
import { enemies } from './enemy-schema'
import type { Position } from './movement'

type RoomEnemy = { id: string; type: string; position: Position }

export type StoreEnemy = {
  id: string
  type: string
  combatant: Combatant
  position: Position
}

export function spawnEnemies(
  roomEnemies: readonly RoomEnemy[],
  table = enemies,
): StoreEnemy[] {
  // Duplicate enemy types get numbered in order ("skeleton 1", "skeleton 2"),
  // while a single enemy of a type keeps its plain name ("giant rat").
  // That needs two counts per type:

  // 1. The total of each type in the room, counted before naming anyone.
  //    It decides whether a type needs numbers at all.
  const typeCounts: Record<string, number> = {}
  roomEnemies.forEach((roomEnemy) => {
    typeCounts[roomEnemy.type] = (typeCounts[roomEnemy.type] ?? 0) + 1
  })

  // 2. How many of each type we've named so far. Starts empty and counts up
  //    inside the map, which gives each duplicate its number.
  const seenCounts: Record<string, number> = {}

  return roomEnemies.map((roomEnemy) => {
    const enemyType = table[roomEnemy.type]
    if (!enemyType) {
      throw new Error(`Unknown enemy type: ${roomEnemy.type}`)
    }

    const seen = (seenCounts[roomEnemy.type] ?? 0) + 1
    seenCounts[roomEnemy.type] = seen

    // `?? 0` because noUncheckedIndexedAccess types a Record lookup as
    // `number | undefined`
    const needsNumber = (typeCounts[roomEnemy.type] ?? 0) > 1
    const name = needsNumber
      ? `${enemyType.displayName} ${seen}`
      : enemyType.displayName

    return {
      id: roomEnemy.id,
      type: roomEnemy.type,
      combatant: {
        name,
        maxHealth: enemyType.maxHealth,
        currentHealth: enemyType.maxHealth,
        armorClass: enemyType.armorClass,
        attackBonus: enemyType.attackBonus,
        initiativeBonus: enemyType.initiativeBonus,
        damageDie: enemyType.damageDie,
      },
      position: roomEnemy.position,
    }
  })
}
