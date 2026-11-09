// Pure helpers for disguised enemies, like the mimic that looks like a chest
// (decided Nov 9). Rule 1: no Phaser, React or Zustand here, so the rules can
// be unit tested.
//
// How a disguise works, in three steps:
// 1. spawnEnemies gives a disguised enemy a `disguise` name (e.g. 'chest').
// 2. Outside a fight, the log names it by that disguise (nameOutsideFight).
// 3. When a fight with it starts, beginCombat unmasks it (unmaskEnemies): the
//    `disguise` is removed, and from then on everything uses its real name.
// The `disguise` field on the store enemy is the one source of truth for
// "is it still disguised?" (rule 2): narration reads it, and the Phaser scene
// reads it to pick the sprite's animation (rule 3).

import type { StoreEnemy } from './spawn-enemies'

// The name the log uses for an enemy when no fight with it is going on, e.g.
// in "A chest appears to the south." While disguised, that's the disguise;
// otherwise the real name ("skeleton 2"). Combat lines don't use this: in a
// fight the enemy is already unmasked, and they read the combat state's name.
// Pick<> means "any object with these two fields", so tests don't need to
// build a whole StoreEnemy.
export function nameOutsideFight(
  enemy: Pick<StoreEnemy, 'combatant' | 'disguise'>,
): string {
  return enemy.disguise ?? enemy.combatant.name
}

// Removes the disguise from every enemy whose id is in `ids` (the enemies in
// the fight that just started). The others are returned as the same objects,
// untouched. Nothing is changed in place: an unmasked enemy is a new object,
// and the result is a new array, so Zustand and the Phaser scene see the
// change.
export function unmaskEnemies(
  enemies: StoreEnemy[],
  ids: readonly string[],
): StoreEnemy[] {
  return enemies.map((enemy) => {
    if (enemy.disguise === undefined || !ids.includes(enemy.id)) {
      return enemy
    }
    // A copy without the disguise. `delete` on the copy, never on `enemy`
    // itself, which still belongs to the old store state.
    const unmasked = { ...enemy }
    delete unmasked.disguise
    return unmasked
  })
}
