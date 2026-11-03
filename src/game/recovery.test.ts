import { describe, expect, it } from 'vitest'
import { makeCombatant } from './test-helpers'
import { recoverHealth } from './recovery'

describe('recoverHealth', () => {
  it('adds the amount to current health', () => {
    const player = makeCombatant({ currentHealth: 6, maxHealth: 12 })

    const healed = recoverHealth(player, 4)

    expect(healed.currentHealth).toBe(10)
  })

  it('does not exceed max health', () => {
    const player = makeCombatant({ currentHealth: 10, maxHealth: 12 })

    const healed = recoverHealth(player, 4)

    expect(healed.currentHealth).toBe(12)
  })

  it('does not add to current health if health is full', () => {
    const player = makeCombatant({ currentHealth: 12, maxHealth: 12 })

    const healed = recoverHealth(player, 4)

    expect(healed.currentHealth).toBe(12)
  })

  it('does not change other properties of the combatant', () => {
    const player = makeCombatant({
      name: 'Test Player',
      currentHealth: 6,
      maxHealth: 12,
      armorClass: 15,
      attackBonus: 3,
      initiativeBonus: 2,
      damageDie: 8,
    })

    const healed = recoverHealth(player, 4)

    expect(healed.name).toBe(player.name)
    expect(healed.maxHealth).toBe(player.maxHealth)
    expect(healed.armorClass).toBe(player.armorClass)
    expect(healed.attackBonus).toBe(player.attackBonus)
    expect(healed.initiativeBonus).toBe(player.initiativeBonus)
    expect(healed.damageDie).toBe(player.damageDie)
  })

  it('does not change its input', () => {
    const player = makeCombatant({ currentHealth: 6, maxHealth: 12 })
    const playerBefore = structuredClone(player)

    recoverHealth(player, 4)

    expect(player).toEqual(playerBefore)
  })

  it('can heal to full by passing max health as the amount', () => {
    const player = makeCombatant({ currentHealth: 3, maxHealth: 12 })

    const healed = recoverHealth(player, player.maxHealth)

    expect(healed.currentHealth).toBe(12)
  })
})
