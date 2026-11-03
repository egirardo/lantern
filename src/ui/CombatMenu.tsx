import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { getAttackOptions } from '../game/narration'

export function CombatMenu() {
  const combat = useStore(gameStore, (state) => state.combat)

  if (!combat) {
    return null
  }

  const options = getAttackOptions(combat)

  return (
    <section aria-labelledby="combat-menu-heading" className="combat-menu">
      <h2 id="combat-menu-heading">Your turn</h2>
      <ul>
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => gameStore.getState().playerAttack(option.id)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
