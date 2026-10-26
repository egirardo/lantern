import type { Direction } from '../game/movement'

export function keyToDirection(key: string): Direction | undefined {
  switch (key) {
    case 'ArrowUp':
      return 'north'
    case 'ArrowDown':
      return 'south'
    case 'ArrowRight':
      return 'east'
    case 'ArrowLeft':
      return 'west'
    default:
      return undefined
  }
}
