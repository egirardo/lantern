import { describe, it, expect } from 'vitest'
import { createGameStore } from './game-store'
import {
  floorLayer,
  validMap,
  validRoom,
  wallsLayer,
} from '../rooms/testing-map'
import type { GameState } from './game-store'
import { describeMove } from '../game/narration'
import type { Room } from '../rooms/room-schema'
import { ZodError } from 'zod'
import { rollOf, sequence } from '../game/test-helpers'
import { PLAYER } from '../game/player'

const playerWinsInitiative = [rollOf(20, 20), rollOf(1, 20)]

// One skeleton at (0, 2). The player starts at (1, 1), so one step south
// puts them next to it.
const roomWithSkeleton: Room = {
  ...validRoom,
  enemies: [{ id: 'e1', type: 'skeleton', position: { x: 0, y: 2 } }],
}

// A fresh store with the skeleton room loaded, after the player has stepped
// south next to the skeleton. `rolls` are all the dice the test will use.
function storeInFight(...rolls: number[]) {
  const store = createGameStore(sequence(...rolls))
  store.getState().loadRoom(roomWithSkeleton, validMap)
  store.getState().movePlayer('south')
  return store
}

describe('gameStore', () => {
  it('starts empty', () => {
    const store = createGameStore()
    const state: GameState = store.getState()
    expect(state.playerPosition).toBeNull()
    expect(state.grid).toBeNull()
    expect(state.room).toBeNull()
    expect(state.log).toEqual([])
  })

  it('loadRoom sets the grid and position and logs the description', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    const state: GameState = store.getState()
    // The grid built from validMap: walls along the top row, floor below
    expect(state.grid).toEqual([
      ['wall', 'wall', 'wall'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ])
    expect(state.playerPosition).toEqual(validRoom.playerStart)
    expect(state.room).toEqual(validRoom)
    expect(state.log.length).toBe(1)
    expect(state.log[0]?.text).toBe(validRoom.description)
    expect(state.tiledMap).toHaveProperty(['tilesets', 0, 'firstgid'], 1)
    expect(state.tiledMap).not.toHaveProperty(['tilesets', 0, 'image'])
  })

  it('movePlayer onto floor updates the position and logs it', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('south')
    const state: GameState = store.getState()
    const describeMoveResult = describeMove(
      { moved: true, newPosition: { x: 1, y: 2 } },
      'south',
    )
    expect(state.log.length).toBe(2)
    expect(state.playerPosition).toEqual({ x: 1, y: 2 })
    expect(state.log[1]?.text).toBe(describeMoveResult)
  })

  it('movePlayer into a wall keeps the position but still logs it', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    store.getState().movePlayer('north')
    // north is a wall in the test map
    const describeMoveResult = describeMove(
      { moved: false, newPosition: { x: 1, y: 1 }, reason: 'wall' },
      'north',
    )
    const state: GameState = store.getState()
    expect(state.playerPosition).toEqual({ x: 1, y: 1 })
    expect(state.log[1]?.text).toBe(describeMoveResult)
    expect(state.log.length).toBe(2)
  })

  it('movePlayer into an exit keeps the position and says how to use it', () => {
    const store = createGameStore()
    store.getState().loadRoom(validRoom, validMap)
    // validRoom has an exit at (0, 0). From the start (1, 1), step west to
    // (0, 1), then walk north into the exit.
    store.getState().movePlayer('west')
    store.getState().movePlayer('north')
    const state: GameState = store.getState()
    expect(state.playerPosition).toEqual({ x: 0, y: 1 })
    expect(state.log.at(-1)?.text).toBe(
      'An exit leads north. Press Enter to use it.',
    )
  })

  it('movePlayer before loadRoom does nothing', () => {
    const store = createGameStore()
    store.getState().movePlayer('south')
    const state: GameState = store.getState()
    expect(state.playerPosition).toBeNull()
    expect(state.grid).toBeNull()
    expect(state.room).toBeNull()
    expect(state.log.length).toBe(0)
  })

  it('two stores from the factory do not share state', () => {
    const store1 = createGameStore()
    const store2 = createGameStore()
    store1.getState().loadRoom(validRoom, validMap)
    const state1: GameState = store1.getState()
    const state2: GameState = store2.getState()
    expect(state2.playerPosition).toBeNull()
    expect(state2.grid).toBeNull()
    expect(state2.room).toBeNull()
    expect(state2.log.length).toEqual(0)
    expect(state1.room).toEqual(validRoom)
  })

  it('loadRoom with invalid data throws, and the state stays empty', () => {
    const store = createGameStore()
    const roomWithoutName: Partial<Room> = { ...validRoom }
    delete roomWithoutName.name
    expect(() => store.getState().loadRoom(roomWithoutName, validMap)).toThrow(
      ZodError,
    )
    const state: GameState = store.getState()
    expect(state.playerPosition).toBeNull()
    expect(state.grid).toBeNull()
    expect(state.room).toBeNull()
    expect(state.log.length).toBe(0)
    expect(state.tiledMap).toBeNull()
  })

  it('expects the store to start with no enemies', () => {
    const store = createGameStore()
    const state: GameState = store.getState()
    expect(state.enemies).toEqual([])
  })

  it('loadRoom fills enemies', () => {
    const store = createGameStore()
    const roomWithEnemy: Room = {
      ...validRoom,
      enemies: [{ id: 'e1', type: 'skeleton', position: { x: 2, y: 2 } }],
    }
    store.getState().loadRoom(roomWithEnemy, validMap)
    const state: GameState = store.getState()
    expect(state.enemies.length).toBe(1)
    const enemy = state.enemies[0]
    expect(enemy?.id).toBe('e1')
    expect(enemy?.type).toBe('skeleton')
    expect(enemy?.position).toEqual({ x: 2, y: 2 })
    expect(enemy?.combatant.currentHealth).toBe(enemy?.combatant.maxHealth)
    expect(enemy?.combatant.name).toBe('skeleton')
  })

  it('moving into an enemy leaves playerPosition unchanged and logs the block', () => {
    const store = createGameStore()
    const roomWithEnemy: Room = {
      ...validRoom,
      enemies: [{ id: 'e1', type: 'skeleton', position: { x: 1, y: 2 } }],
    }
    store.getState().loadRoom(roomWithEnemy, validMap)
    store.getState().movePlayer('south')
    const state: GameState = store.getState()
    expect(state.playerPosition).toEqual({ x: 1, y: 1 })
    const describeMoveResult = describeMove(
      { moved: false, newPosition: { x: 1, y: 2 }, reason: 'enemy' },
      'south',
    )
    expect(state.log.at(-1)?.text).toBe(describeMoveResult)
  })

  it('moving next to an enemy is allowed', () => {
    // Stepping next to the skeleton starts a fight, which rolls initiative.
    // A fixed sequence keeps the test from rolling real dice.
    const store = createGameStore(sequence(...playerWinsInitiative))
    const roomWithEnemy: Room = {
      ...validRoom,
      enemies: [{ id: 'e1', type: 'skeleton', position: { x: 0, y: 2 } }],
    }
    store.getState().loadRoom(roomWithEnemy, validMap)
    store.getState().movePlayer('south')
    const state: GameState = store.getState()
    expect(state.playerPosition).toEqual({ x: 1, y: 2 })
    const describeMoveResult = describeMove(
      { moved: true, newPosition: { x: 1, y: 2 } },
      'south',
    )
    // The step starts a fight, so the newest line is the turn cue. Check that
    // the step line is somewhere in the log instead.
    expect(state.log.map((entry) => entry.text)).toContain(describeMoveResult)
  })

  it('reloading a room replaces the old enemies', () => {
    const store = createGameStore()
    const roomWithEnemy1: Room = {
      ...validRoom,
      enemies: [{ id: 'e1', type: 'skeleton', position: { x: 2, y: 2 } }],
    }
    store.getState().loadRoom(roomWithEnemy1, validMap)
    const stateAfterFirstLoad: GameState = store.getState()
    expect(stateAfterFirstLoad.enemies.length).toBe(1)
    const roomWithEnemy2: Room = {
      ...validRoom,
      enemies: [{ id: 'e2', type: 'orc', position: { x: 0, y: 2 } }],
    }
    store.getState().loadRoom(roomWithEnemy2, validMap)
    const stateAfterSecondLoad: GameState = store.getState()
    expect(stateAfterSecondLoad.enemies.length).toBe(1)
    expect(stateAfterSecondLoad.enemies[0]?.id).toBe('e2')
  })

  it('starts with the full-health player and no combat', () => {
    const store = createGameStore()
    const state: GameState = store.getState()
    expect(state.player).toEqual(PLAYER)
    expect(state.combat).toBeNull()
  })

  it('starts combat when the player walks next to an enemy, and the player wins initiative', () => {
    const store = storeInFight(...playerWinsInitiative)
    const state: GameState = store.getState()
    expect(state.combat).not.toBeNull()
    expect(state.combat?.player).toEqual(PLAYER)
    expect(state.combat?.enemies.length).toBe(1)
    expect(state.combat?.enemies[0]?.id).toBe('e1')
    // The fight start is narrated: the room description, the step, the
    // "attacks you" line, one initiative line each for the player and the
    // skeleton, and the turn cue.
    expect(state.log.length).toBe(7)
  })

  it('does not allow a player to move while in combat', () => {
    const store = storeInFight(...playerWinsInitiative)
    const stateBeforeMove: GameState = store.getState()
    expect(stateBeforeMove.combat).not.toBeNull()
    // East, because (2, 2) is floor: only the fight can stop this move.
    // South would be blocked by the edge of the map even without a fight.
    store.getState().movePlayer('east')
    const stateAfterMove: GameState = store.getState()
    expect(stateAfterMove.playerPosition).toEqual({ x: 1, y: 2 })
    expect(stateAfterMove.combat).not.toBeNull()
    // The log tells the player why nothing happened.
    expect(stateAfterMove.log.at(-1)?.text).toBe(
      'You are in a fight and cannot move.',
    )
  })

  it('playerAttack hurts the enemy in state.enemies', () => {
    const store = storeInFight(
      ...playerWinsInitiative, // initiative: player 22, skeleton 2 → player goes first
      rollOf(10, 20), // player's attack: 10 + 3 = 13 against AC 10 → hit
      rollOf(2, 6), // player's damage: 2 → skeleton goes from 4 to 2 HP
      rollOf(1, 20), // skeleton's attack: natural 1 → always a miss, no damage roll
    )

    store.getState().playerAttack('e1')
    const state: GameState = store.getState()

    // The store's own enemy list has the new health, not only the combat state.
    expect(state.enemies[0]?.combatant.currentHealth).toBe(2)
    // The skeleton is still alive, so the fight goes on.
    expect(state.combat).not.toBeNull()
    // The skeleton missed, so the player is unhurt.
    expect(state.player.currentHealth).toBe(12)
  })

  it('playerAttack that kills the enemy removes it from state.enemies and ends combat, then makes a move', () => {
    const store = storeInFight(
      ...playerWinsInitiative, // initiative: player 22, skeleton 2 → player goes first
      rollOf(10, 20), // player's attack: 10 + 3 = 13 against AC 10 → hit
      rollOf(4, 6), // player's damage: 4 → skeleton goes from 4 to 0 HP → dead
    )
    store.getState().playerAttack('e1')
    const state: GameState = store.getState()
    expect(state.enemies.length).toBe(0)
    expect(state.combat).toBeNull()
    // West is the tile where the skeleton stood. It's free now that the
    // skeleton is gone from state.enemies.
    store.getState().movePlayer('west')
    const stateAfterMove: GameState = store.getState()
    expect(stateAfterMove.playerPosition).toEqual({ x: 0, y: 2 })
  })

  it('after the player falls, they can no longer move or attack', () => {
    const store = storeInFight(
      // Initiative: player 1 + 2 = 3, skeleton 10 + 1 = 11 → skeleton goes first
      rollOf(1, 20),
      rollOf(10, 20),
      // Skeleton's first turn: natural 20 → critical hit, two d4 damage rolls
      rollOf(20, 20),
      rollOf(4, 4),
      rollOf(4, 4), // 8 damage → player goes from 12 to 4 HP
      // Player's attack: natural 1 → always a miss, no damage roll
      rollOf(1, 20),
      // Skeleton's second turn: another critical hit for 8 → player goes from 4 to 0
      rollOf(20, 20),
      rollOf(4, 4),
      rollOf(4, 4),
    )

    // The fight: the player misses, then the skeleton strikes the killing blow.
    store.getState().playerAttack('e1')
    const afterFight: GameState = store.getState()
    expect(afterFight.player.currentHealth).toBe(0)
    expect(afterFight.combat).toBeNull() // a lost fight is cleared too

    // After the game is over: try to act, and count what gets logged.
    const logLengthBefore = afterFight.log.length
    store.getState().movePlayer('north')
    store.getState().playerAttack('e1')
    const state: GameState = store.getState()

    // Only movePlayer writes a line. playerAttack returns early because combat is null.
    expect(state.log.length).toBe(logLengthBefore + 1)
    expect(state.log.at(-1)?.text).toBe('You have fallen in battle.')
    expect(state.playerPosition).toEqual({ x: 1, y: 2 })
  })

  it('entering a room ends any fight in progress, but the player keeps their health', () => {
    // In the middle of a fight (the skeleton has hit the player for 3, leaving
    // 9 HP), the room is loaded again, as if the player entered a new room.
    // The fight is gone and the player is at the room's start position, but
    // still has 9 HP, because health carries over between rooms.
    const store = storeInFight(
      ...playerWinsInitiative, // initiative: player 22, skeleton 2 → player goes first
      rollOf(10, 20), // player's attack: 10 + 3 = 13 against AC 10 → hit
      rollOf(2, 6), // player's damage: 2 → skeleton goes from 4 to 2 HP
      rollOf(15, 20), // skeleton's attack: 15 + 2 = 17 against AC 12 → hit
      rollOf(3, 4), // skeleton's damage: 3 → player goes from 12 to 9 HP
    )
    store.getState().playerAttack('e1')
    const stateInFight: GameState = store.getState()
    // Check the setup: the fight is still going, and the player is hurt.
    expect(stateInFight.combat).not.toBeNull()
    expect(stateInFight.player.currentHealth).toBe(9)

    store.getState().loadRoom(roomWithSkeleton, validMap)
    const state: GameState = store.getState()
    expect(state.combat).toBeNull()
    expect(state.player.currentHealth).toBe(9)
    expect(state.playerPosition).toEqual({ x: 1, y: 1 })
  })

  describe('reveal narration in loadRoom and movePlayer', () => {
    // 7 tiles wide, so an enemy can start outside the lantern (radius 2.5).
    // validMap is too small: from anywhere in it, every floor tile is lit.
    // Walls along the top row, floor below, like validMap.
    const wideMap = {
      ...validMap,
      width: 7,
      layers: [
        { ...floorLayer, width: 7, data: new Array<number>(21).fill(258) },
        {
          ...wallsLayer,
          width: 7,
          data: [
            ...new Array<number>(7).fill(66),
            ...new Array<number>(14).fill(0),
          ],
        },
      ],
    }

    // The player starts at (1, 1). The skeleton at (4, 1) is 3 tiles east:
    // dark (9 > 6.25). One step east makes it 2 tiles away: lit (4 <= 6.25),
    // but not adjacent, so no fight starts.
    const roomWithDistantSkeleton: Room = {
      ...validRoom,
      enemies: [{ id: 'e1', type: 'skeleton', position: { x: 4, y: 1 } }],
    }

    // The strings are written out instead of calling describeReveal, so the
    // tests check the whole chain from the store to the log line.

    it('logs the step, then the enemy that came into the light', () => {
      const store = createGameStore()
      store.getState().loadRoom(roomWithDistantSkeleton, wideMap)
      store.getState().movePlayer('east')
      expect(store.getState().log.map((entry) => entry.text)).toEqual([
        validRoom.description,
        'You have taken a step to the east.',
        'A skeleton appears to the east.',
      ])
    })

    it('does not announce an enemy in the dark when the room loads', () => {
      const store = createGameStore()
      store.getState().loadRoom(roomWithDistantSkeleton, wideMap)
      expect(store.getState().log.map((entry) => entry.text)).toEqual([
        validRoom.description,
      ])
    })

    it('announces an enemy that is already lit when the room loads', () => {
      const store = createGameStore()
      // The skeleton at (0, 2) is one step west and one south of the start.
      store.getState().loadRoom(roomWithSkeleton, validMap)
      expect(store.getState().log.map((entry) => entry.text)).toEqual([
        validRoom.description,
        'A skeleton appears to the south-west.',
      ])
    })

    it('does not announce the enemy again after a blocked move', () => {
      const store = createGameStore()
      store.getState().loadRoom(roomWithSkeleton, validMap)
      // North of the start is the wall row, so the player stays put.
      store.getState().movePlayer('north')
      expect(store.getState().log.map((entry) => entry.text)).toEqual([
        validRoom.description,
        'A skeleton appears to the south-west.',
        'You cannot move to the north. A wall blocks your path.',
      ])
    })

    it('announces the enemy again with "the" each time it comes back into the light', () => {
      const store = createGameStore()
      store.getState().loadRoom(roomWithDistantSkeleton, wideMap)
      store.getState().movePlayer('east') // lit
      store.getState().movePlayer('west') // dark again
      store.getState().movePlayer('east') // lit again
      // "A" the first time, "The" when it comes back, so it doesn't sound
      // like a second skeleton.
      const reveals = store
        .getState()
        .log.map((entry) => entry.text)
        .filter((text) => text.includes('appears'))
      expect(reveals).toEqual([
        'A skeleton appears to the east.',
        'The skeleton appears to the east.',
      ])
    })

    it('forgets the seen enemies when a room loads', () => {
      const store = createGameStore()
      store.getState().loadRoom(roomWithSkeleton, validMap)
      // Same room again: the enemy ids repeat, but it's a new visit.
      store.getState().loadRoom(roomWithSkeleton, validMap)
      expect(store.getState().log.at(-1)?.text).toBe(
        'A skeleton appears to the south-west.',
      )
    })
  })

  describe('exits and room changes', () => {
    // Fixture rooms on validMap (walls along the top row, floor below):
    //   [W, W, W]
    //   [F, F, F]
    //   [F, F, F]
    // validRoom ('room-1') has exits at (0, 0) to 'room-2' and (2, 0) to
    // 'room-3'. Stepping west from its start (1, 1) puts the player at
    // (0, 1), right below the exit to 'room-2'.

    // 'room-2' leads back to 'room-1' through (2, 0), so arriving from
    // 'room-1' puts the player at (2, 1). Its playerStart is (0, 2), so a
    // test can tell the two apart.
    const room2: Room = {
      ...validRoom,
      id: 'room-2',
      description: 'The second room.',
      playerStart: { x: 0, y: 2 },
      exits: [{ tiles: [{ x: 2, y: 0 }], to: 'room-1' }],
    }

    // 'room-1', but its exit to 'room-2' is locked with the rusty key.
    const lockedRoom: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], to: 'room-2', requires: 'rusty-key' }],
    }

    // 'room-1', but its only exit is the final exit out of the dungeon.
    const finalRoom: Room = {
      ...validRoom,
      exits: [{ tiles: [{ x: 0, y: 0 }], final: true }],
    }

    // A store with `room` loaded and the player moved below the exit at (0, 0).
    function storeNextToExit(room: Room = validRoom) {
      const store = createGameStore()
      store.getState().loadRoom(room, validMap)
      store.getState().movePlayer('west')
      return store
    }

    function texts(store: ReturnType<typeof createGameStore>): string[] {
      return store.getState().log.map((entry) => entry.text)
    }

    it('starts in the first room, carrying nothing, not escaped', () => {
      const state: GameState = createGameStore().getState()
      expect(state.currentRoomId).toBe('entrance-hall')
      expect(state.arrivingFrom).toBeNull()
      expect(state.inventory).toEqual([])
      expect(state.hasEscaped).toBe(false)
    })

    it('loadRoom makes the loaded room the current one', () => {
      const store = createGameStore()
      store.getState().loadRoom(validRoom, validMap)
      expect(store.getState().currentRoomId).toBe('room-1')
    })

    it('takeExit changes the current room, remembers where the player came from and logs it', () => {
      const store = storeNextToExit()
      store.getState().takeExit()
      const state: GameState = store.getState()
      expect(state.currentRoomId).toBe('room-2')
      expect(state.arrivingFrom).toBe('room-1')
      // The old room stays until RoomLoader has fetched and loaded the new one.
      expect(state.room?.id).toBe('room-1')
      expect(texts(store).slice(-2)).toEqual([
        'You go through the exit to the north.',
        'You recover to full health. You have 12 out of 12 health.',
      ])
    })

    it('takeExit heals the player to full health', () => {
      const store = storeNextToExit()
      // setState writes straight into the store, so the test can start
      // from a hurt player without playing a whole fight.
      store.setState({ player: { ...PLAYER, currentHealth: 3 } })
      store.getState().takeExit()
      expect(store.getState().player.currentHealth).toBe(PLAYER.maxHealth)
    })

    it('loading the next room places the player at the doorway back, not playerStart', () => {
      const store = storeNextToExit()
      store.getState().takeExit()
      store.getState().loadRoom(room2, validMap)
      const state: GameState = store.getState()
      expect(state.room?.id).toBe('room-2')
      expect(state.playerPosition).toEqual({ x: 2, y: 1 })
      expect(state.arrivingFrom).toBeNull()
      expect(state.log.at(-1)?.text).toBe('The second room.')
    })

    it('uses playerStart when the next room has no exit back', () => {
      const oneWayRoom: Room = { ...room2, exits: [] }
      const store = storeNextToExit()
      store.getState().takeExit()
      store.getState().loadRoom(oneWayRoom, validMap)
      expect(store.getState().playerPosition).toEqual({ x: 0, y: 2 })
    })

    it('ignores moves and exits while the next room is loading', () => {
      const store = storeNextToExit()
      store.getState().takeExit()
      const before: GameState = store.getState()
      store.getState().movePlayer('east')
      store.getState().takeExit()
      const after: GameState = store.getState()
      expect(after.playerPosition).toEqual(before.playerPosition)
      expect(after.log).toEqual(before.log)
    })

    it('takeExit away from any exit stays and says so', () => {
      const store = createGameStore()
      store.getState().loadRoom(validRoom, validMap)
      // The start (1, 1) is diagonal to both exits, so neither counts.
      store.getState().takeExit()
      expect(store.getState().currentRoomId).toBe('room-1')
      expect(texts(store).at(-1)).toBe('There is no exit next to you.')
    })

    it('takeExit during a fight stays and says so', () => {
      const store = storeInFight(...playerWinsInitiative)
      store.getState().takeExit()
      const state: GameState = store.getState()
      expect(state.currentRoomId).toBe('room-1')
      expect(state.combat).not.toBeNull()
      expect(texts(store).at(-1)).toBe("You can't leave during a fight.")
    })

    it('a locked exit stays shut without the key', () => {
      const store = storeNextToExit(lockedRoom)
      store.getState().takeExit()
      expect(store.getState().currentRoomId).toBe('room-1')
      expect(texts(store).at(-1)).toBe('The door is locked. You need a key.')
    })

    it('a locked exit opens with the key in the inventory', () => {
      const store = storeNextToExit(lockedRoom)
      // A fixture inventory: picking items up comes later (Agent E).
      store.setState({ inventory: ['rusty-key'] })
      store.getState().takeExit()
      expect(store.getState().currentRoomId).toBe('room-2')
      expect(texts(store).slice(-3)).toEqual([
        'You unlock the door with the rusty key.',
        'You go through the exit to the north.',
        'You recover to full health. You have 12 out of 12 health.',
      ])
    })

    it('the final exit wins the game, and the player can no longer move or use exits', () => {
      const store = storeNextToExit(finalRoom)
      store.getState().takeExit()
      expect(store.getState().hasEscaped).toBe(true)
      expect(texts(store).at(-1)).toBe(
        'Victory! You climb out of the dungeon. Reload the page to play again.',
      )

      store.getState().movePlayer('east')
      store.getState().takeExit()
      const state: GameState = store.getState()
      expect(state.playerPosition).toEqual({ x: 0, y: 1 })
      expect(texts(store).slice(-2)).toEqual([
        'You have already escaped the dungeon.',
        'You have already escaped the dungeon.',
      ])
    })

    it('takeExit after the player has fallen only says they have fallen', () => {
      const store = storeNextToExit()
      store.setState({ player: { ...PLAYER, currentHealth: 0 } })
      store.getState().takeExit()
      expect(store.getState().currentRoomId).toBe('room-1')
      expect(texts(store).at(-1)).toBe('You have fallen in battle.')
    })
  })
})
