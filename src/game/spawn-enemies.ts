import type { Combatant } from './combat'
import { enemies } from './enemy-schema'
import type { Position } from './movement'

// `carries` is optional, like in the room file: most enemies carry nothing.
type RoomEnemy = {
  id: string
  type: string
  position: Position
  carries?: string
}

export type StoreEnemy = {
  id: string
  type: string
  combatant: Combatant
  position: Position
  // Only on a disguised enemy that hasn't been unmasked yet: the name the log
  // uses for it outside a fight, e.g. 'chest' for the mimic (see disguise.ts).
  // beginCombat removes it when a fight with the enemy starts.
  disguise?: string
  // Only on an enemy that carries an item: the item type (e.g. 'gold-key')
  // that goes into the player's inventory when it is defeated.
  carries?: string
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
    // The same number goes on the disguise, so two mimics are "chest 1" and
    // "chest 2" before the fight and "mimic 1" and "mimic 2" after it.
    const number = needsNumber ? ` ${seen}` : ''
    const name = `${enemyType.displayName}${number}`

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
      // The two optional fields are only added when they have a value, so an
      // ordinary enemy has no `disguise: undefined` key at all. When the
      // check is false, `&&` gives `false`, and spreading `false` adds nothing.
      ...(enemyType.disguise !== undefined && {
        disguise: `${enemyType.disguise}${number}`,
      }),
      ...(roomEnemy.carries !== undefined && { carries: roomEnemy.carries }),
    }
  })
}
