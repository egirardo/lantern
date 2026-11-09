import { describe, it, expect } from 'vitest'
import { nameOutsideFight, unmaskEnemies } from './disguise'
import { makeCombatant, makeStoreEnemy } from './test-helpers'

// A mimic disguised as a chest, as spawnEnemies makes it.
function makeMimic(id = 'm1') {
  return makeStoreEnemy(id, {
    type: 'mimic',
    combatant: makeCombatant({ name: 'mimic' }),
    disguise: 'chest',
  })
}

describe('nameOutsideFight', () => {
  it('is the disguise while the enemy is disguised', () => {
    expect(nameOutsideFight(makeMimic())).toBe('chest')
  })

  it('is the real name of an enemy without a disguise', () => {
    const skeleton = makeStoreEnemy('e1', {
      combatant: makeCombatant({ name: 'skeleton 2' }),
    })
    expect(nameOutsideFight(skeleton)).toBe('skeleton 2')
  })
})

describe('unmaskEnemies', () => {
  it('removes the disguise of an enemy in the fight', () => {
    const [unmasked] = unmaskEnemies([makeMimic()], ['m1'])
    // Not just `disguise: undefined`: the key is gone, so the enemy looks
    // exactly like one that was never disguised.
    expect(unmasked).not.toHaveProperty('disguise')
    expect(unmasked?.combatant.name).toBe('mimic')
  })

  it('leaves a disguised enemy that is not in the fight as it was', () => {
    const farMimic = makeMimic('m2')
    const result = unmaskEnemies([makeMimic('m1'), farMimic], ['m1'])
    // toBe: the same object, untouched, not a copy.
    expect(result[1]).toBe(farMimic)
    expect(result[1]?.disguise).toBe('chest')
  })

  it('returns enemies without a disguise as the same objects', () => {
    const skeleton = makeStoreEnemy('e1')
    expect(unmaskEnemies([skeleton], ['e1'])[0]).toBe(skeleton)
  })

  it("doesn't change the enemies it was given", () => {
    const mimic = makeMimic()
    unmaskEnemies([mimic], ['m1'])
    expect(mimic.disguise).toBe('chest')
  })
})
