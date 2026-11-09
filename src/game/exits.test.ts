import { describe, it, expect } from 'vitest'
import {
  exitStep,
  findAdjacentExit,
  findArrivalPosition,
  type ExitStepInput,
  findExitBackIndex,
  findNewlyAdjacentExit,
} from './exits'
import type { Exit } from '../rooms/room-schema'
import type { Grid } from './movement'
import { makeCombatant } from './test-helpers'

// A small fixture room, 5 wide and 4 tall. Walls all round, floor inside.
// Three exits in the walls:
//   y=0  W  N  W  W  W     N = (1, 0), a door north to 'north-room'
//   y=1  W  .  .  .  E     E = (4, 1), a locked door east to 'east-room'
//   y=2  W  .  .  .  W
//   y=3  W  W  F  W  W     F = (2, 3), the final exit (locked)
const grid: Grid = [
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall'],
]

const northDoor: Exit = { tiles: [{ x: 1, y: 0 }], to: 'north-room' }
const lockedEastDoor: Exit = {
  tiles: [{ x: 4, y: 1 }],
  to: 'east-room',
  requires: 'gold-key',
}
const finalExit: Exit = {
  tiles: [{ x: 2, y: 3 }],
  final: true,
  requires: 'gold-key',
}
const exits: Exit[] = [northDoor, lockedEastDoor, finalExit]

describe('findAdjacentExit', () => {
  it('finds the exit straight north of the player, and its direction', () => {
    expect(findAdjacentExit({ x: 1, y: 1 }, exits)).toEqual({
      exit: northDoor,
      direction: 'north',
    })
  })

  it('finds an exit to the east and south too', () => {
    expect(findAdjacentExit({ x: 3, y: 1 }, exits)?.direction).toBe('east')
    expect(findAdjacentExit({ x: 2, y: 2 }, exits)?.direction).toBe('south')
  })

  it('returns null when no exit is next to the player', () => {
    expect(findAdjacentExit({ x: 2, y: 1 }, exits)).toBeNull()
  })

  it('does not count an exit diagonally from the player', () => {
    // (2, 1) is diagonal to the north door at (1, 0).
    expect(findAdjacentExit({ x: 2, y: 1 }, [northDoor])).toBeNull()
  })

  it('finds any tile of a wide exit', () => {
    const wideDoor: Exit = {
      tiles: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      to: 'north-room',
    }
    expect(findAdjacentExit({ x: 2, y: 1 }, [wideDoor])?.exit).toBe(wideDoor)
  })

  it('picks the first exit in the room file when two touch the player', () => {
    // At (1, 1) the north door is north, and a second door is west.
    const westDoor: Exit = { tiles: [{ x: 0, y: 1 }], to: 'west-room' }
    expect(findAdjacentExit({ x: 1, y: 1 }, [westDoor, northDoor])?.exit).toBe(
      westDoor,
    )
  })
})

describe('findArrivalPosition', () => {
  const playerStart = { x: 2, y: 2 }

  it('uses playerStart at the start of a new game', () => {
    expect(findArrivalPosition(grid, exits, playerStart, null)).toEqual(
      playerStart,
    )
  })

  it('places the player next to the exit back to the room they came from', () => {
    // Coming from 'north-room': its door is at (1, 0), the floor below is (1, 1).
    expect(findArrivalPosition(grid, exits, playerStart, 'north-room')).toEqual(
      { x: 1, y: 1 },
    )
  })

  it('works for an exit in a side wall', () => {
    // The east door is at (4, 1), the floor west of it is (3, 1).
    expect(findArrivalPosition(grid, exits, playerStart, 'east-room')).toEqual({
      x: 3,
      y: 1,
    })
  })

  it('falls back to playerStart when no exit leads back', () => {
    // A one-way door: nothing in this room leads to 'far-room'.
    expect(findArrivalPosition(grid, exits, playerStart, 'far-room')).toEqual(
      playerStart,
    )
  })

  it('never treats the final exit as the way back', () => {
    // Only the final exit is in the room, and it has no `to`.
    expect(
      findArrivalPosition(grid, [finalExit], playerStart, 'north-room'),
    ).toEqual(playerStart)
  })

  it('skips a tile next to the exit where an enemy stands', () => {
    // A two-tile door at (1, 0) and (2, 0). An enemy on (1, 1), below the
    // first tile, so the player arrives below the second tile instead.
    const wideDoor: Exit = {
      tiles: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      to: 'north-room',
    }
    expect(
      findArrivalPosition(grid, [wideDoor], playerStart, 'north-room', [
        { x: 1, y: 1 },
      ]),
    ).toEqual({ x: 2, y: 1 })
  })

  it('falls back to playerStart when every tile next to the exit is taken', () => {
    expect(
      findArrivalPosition(grid, exits, playerStart, 'north-room', [
        { x: 1, y: 1 },
      ]),
    ).toEqual(playerStart)
  })
})

describe('exitStep', () => {
  // The player stands below the north door, hurt, carrying nothing. Each
  // test changes only what it needs.
  const input: ExitStepInput = {
    position: { x: 1, y: 1 },
    exits,
    inCombat: false,
    inventory: [],
    player: makeCombatant({ currentHealth: 5, maxHealth: 12 }),
  }

  function texts(step: { lines: { text: string }[] }): string[] {
    return step.lines.map((line) => line.text)
  }

  it('goes through an exit to its room and heals the player to full', () => {
    const step = exitStep(input)
    expect(step.kind).toBe('leave')
    // `if` narrows the union, so the test can read `to` and `player`.
    if (step.kind !== 'leave') return
    expect(step.to).toBe('north-room')
    expect(step.player.currentHealth).toBe(12)
    expect(texts(step)).toEqual([
      'You go through the exit to the north.',
      'You recover to full health. You have 12 out of 12 health.',
    ])
  })

  it('does not change the player it was given', () => {
    exitStep(input)
    expect(input.player.currentHealth).toBe(5)
  })

  it('blocks leaving during a fight', () => {
    const step = exitStep({ ...input, inCombat: true })
    expect(step).toEqual({
      kind: 'stay',
      lines: [{ text: "You can't leave during a fight.", urgency: 'polite' }],
    })
  })

  it('says so when there is no exit next to the player', () => {
    const step = exitStep({ ...input, position: { x: 2, y: 1 } })
    expect(step.kind).toBe('stay')
    expect(texts(step)).toEqual(['There is no exit next to you.'])
  })

  it('keeps a locked exit shut without the key', () => {
    const step = exitStep({ ...input, position: { x: 3, y: 1 } })
    expect(step.kind).toBe('stay')
    expect(texts(step)).toEqual(['The door is locked. You need a key.'])
  })

  it('does not count a different item as the key', () => {
    const step = exitStep({
      ...input,
      position: { x: 3, y: 1 },
      inventory: ['golden-key'],
    })
    expect(step.kind).toBe('stay')
  })

  it('unlocks a locked exit with the key, then goes through', () => {
    const step = exitStep({
      ...input,
      position: { x: 3, y: 1 },
      inventory: ['gold-key'],
    })
    expect(step.kind).toBe('leave')
    if (step.kind !== 'leave') return
    expect(step.to).toBe('east-room')
    expect(texts(step)).toEqual([
      'You unlock the door with the gold key.',
      'You go through the exit to the east.',
      'You recover to full health. You have 12 out of 12 health.',
    ])
  })

  it('keeps the locked final exit shut without the key', () => {
    const step = exitStep({ ...input, position: { x: 2, y: 2 } })
    expect(step.kind).toBe('stay')
    expect(texts(step)).toEqual(['The door is locked. You need a key.'])
  })

  it('wins the game through the final exit with the key', () => {
    const step = exitStep({
      ...input,
      position: { x: 2, y: 2 },
      inventory: ['gold-key'],
    })
    expect(step.kind).toBe('escape')
    expect(texts(step)).toEqual([
      'You unlock the door with the gold key.',
      'Victory! You climb out of the dungeon. Reload the page to play again.',
    ])
  })

  it('wins through an unlocked final exit with only the victory line', () => {
    const openFinalExit: Exit = { tiles: [{ x: 2, y: 3 }], final: true }
    const step = exitStep({
      ...input,
      position: { x: 2, y: 2 },
      exits: [openFinalExit],
    })
    expect(step.kind).toBe('escape')
    expect(texts(step)).toEqual([
      'Victory! You climb out of the dungeon. Reload the page to play again.',
    ])
  })

  it('checks the fight before anything else', () => {
    // Not next to an exit and in a fight: the fight line wins.
    const step = exitStep({
      ...input,
      position: { x: 2, y: 1 },
      inCombat: true,
    })
    expect(texts(step)).toEqual(["You can't leave during a fight."])
  })
})

describe('findNewlyAdjacentExit', () => {
  // northDoor is at (1, 0), so (1, 1) is right below it.

  it('finds the exit a step has just put the player next to', () => {
    expect(
      findNewlyAdjacentExit({ x: 2, y: 1 }, { x: 1, y: 1 }, exits),
    ).toEqual({ exit: northDoor, direction: 'north' })
  })

  it('returns null when the step ends next to no exit', () => {
    expect(
      findNewlyAdjacentExit({ x: 1, y: 1 }, { x: 1, y: 2 }, exits),
    ).toBeNull()
  })

  it('returns null when the player was already next to that exit', () => {
    // A two-tile door at (1, 0) and (2, 0): stepping from below one half to
    // below the other is still next to the same exit.
    const wideDoor: Exit = {
      tiles: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      to: 'north-room',
    }
    expect(
      findNewlyAdjacentExit({ x: 1, y: 1 }, { x: 2, y: 1 }, [wideDoor]),
    ).toBeNull()
  })

  it('finds a different exit than the one the player was next to', () => {
    // From below northDoor (1, 0) to (3, 1), next to lockedEastDoor (4, 1).
    // Two exits apart in one step isn't possible on this map, so the test
    // passes the positions directly: the helper only compares the two.
    expect(
      findNewlyAdjacentExit({ x: 1, y: 1 }, { x: 3, y: 1 }, exits),
    ).toEqual({ exit: lockedEastDoor, direction: 'east' })
  })

  it('returns null for a blocked move (the same position before and after)', () => {
    expect(
      findNewlyAdjacentExit({ x: 1, y: 1 }, { x: 1, y: 1 }, exits),
    ).toBeNull()
  })
})

describe('findExitBackIndex', () => {
  it('returns null when fromRoomId is null', () => {
    expect(findExitBackIndex(exits, null)).toBeNull()
  })

  it('returns the index of the exit whose to matches fromRoomId', () => {
    const exitsWithMatch: Exit[] = [
      { tiles: [{ x: 0, y: 0 }], to: 'other-room' },
      { tiles: [{ x: 1, y: 0 }], to: 'north-room' },
    ]
    expect(findExitBackIndex(exitsWithMatch, 'north-room')).toBe(1)
  })

  it('returns null when no exit matches fromRoomId', () => {
    expect(findExitBackIndex(exits, 'nonexistent-room')).toBeNull()
  })

  it('never matches the final exit', () => {
    expect(findExitBackIndex([finalExit], 'any-room')).toBeNull()
  })

  it('returns the first index when two exits lead to the same room', () => {
    const exitsWithDuplicates: Exit[] = [
      { tiles: [{ x: 0, y: 0 }], to: 'north-room' },
      { tiles: [{ x: 1, y: 0 }], to: 'north-room' },
    ]
    expect(findExitBackIndex(exitsWithDuplicates, 'north-room')).toBe(0)
  })
})
