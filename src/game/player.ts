import type { Combatant } from './combat'

const PLAYER_MAX_HEALTH = 12

export const PLAYER: Combatant = {
  name: 'Player',
  maxHealth: PLAYER_MAX_HEALTH,
  currentHealth: PLAYER_MAX_HEALTH,
  armorClass: 12,
  attackBonus: 3,
  initiativeBonus: 2,
  damageDie: 6,
}
