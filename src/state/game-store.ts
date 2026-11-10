import { createStore } from 'zustand/vanilla'
import {
  movePlayer as computeMove,
  type Direction,
  type Grid,
  type Position,
} from '../game/movement'
import { loadRoom as loadRoomFromFiles } from '../rooms/load-room'
import type { Exit, Room } from '../rooms/room-schema'
import {
  describeAlreadyEscaped,
  describeArrivalExit,
  describeExitReveal,
  describeFeatureReveal,
  describeItemReveal,
  describeMove,
  describeNextToExit,
  describeReveal,
} from '../game/narration'
import type { TiledMap } from '../rooms/tiled-schema'
import { spawnEnemies, type StoreEnemy } from '../game/spawn-enemies'
import {
  type LogLine,
  playerAttackStep,
  beginCombat,
} from '../game/combat-flow'
import type { Combatant, CombatState } from '../game/combat'
import { getAdjacentEnemies } from '../game/adjacency'
import { PLAYER } from '../game/player'
import {
  getNewlyLit,
  getNewlyLitExits,
  getNewlyLitItems,
  getVisibleTiles,
  isLit,
  LANTERN_RADIUS,
  nearestTile,
} from '../game/visibility'
import { directionFrom } from '../game/compass'
import {
  exitStep,
  findArrivalPosition,
  findExitBackIndex,
  findNewlyAdjacentExit,
} from '../game/exits'
import { itemDisplayName, pickUpItems, type StoreItem } from '../game/items'
import type { Feature } from '../game/features'
import {
  getNewlyLitPieces,
  groupFeaturePieces,
  groupFeatureReveals,
} from '../game/feature-reveal'
import {
  defaultSettings,
  osPrefersReducedMotion,
  settingsSchema,
  type Settings,
} from './settings'
import type { SaveContent } from '../save/save-rules'

type LogEntry = LogLine & { id: string }

// The room a new game starts in. RoomLoader loads whatever currentRoomId
// says, so this is where the first fetch comes from.
export const FIRST_ROOM_ID = 'entrance-hall'

// The line when the player tries to act after falling. Used by movePlayer
// and takeExit, so both say the same thing.
const FALLEN_TEXT = 'You have fallen in battle.'

export type GameState = {
  playerPosition: Position | null
  grid: Grid | null
  // The named tiles in the room (e.g. barrels), from the tile names table,
  // at most one per cell. Next to the grid, which only says 'floor' or
  // 'wall'. Read by the blocked-move text (Phase K step 3) and the decor
  // reveals (step 7). [] until a room is loaded, like enemies: unlike grid,
  // an empty list is also a real answer (no decor).
  features: Feature[]
  room: Room | null
  tiledMap: TiledMap | null
  // The id of the room the player is in, or is on the way to. RoomLoader
  // watches it: when an exit changes it, RoomLoader fetches that room's files
  // and calls loadRoom. Until loadRoom has run, `room` is still the old room,
  // so room.id !== currentRoomId means "the next room is loading".
  currentRoomId: string
  // The room the player just left through an exit, so loadRoom can place
  // them at the doorway that leads back there. null at the start of a game,
  // which places the player at playerStart. loadRoom sets it back to null.
  arrivingFrom: string | null
  // The item types the player carries, e.g. ['gold-key'], in the order they
  // were picked up. Types, not ids (decided Nov 6): a locked exit checks this
  // list for the type it needs. Kept across room changes, unlike `items`.
  inventory: string[]
  // True once the player has gone through the final exit and won. Like
  // game over (health 0), nothing can be done after that.
  hasEscaped: boolean
  // The exit lines ("You go through the exit…", "You recover to full
  // health…") waiting for the next room to load. takeExit puts them here
  // instead of in the log, and loadRoom logs them before the description, in
  // the same set(). That makes a room change one log batch: LiveAnnouncer
  // replaces its batch on every log update, so with two updates a few ms
  // apart, VoiceOver skipped the exit lines and only read the description
  // (found in the VoiceOver playtest, Nov 6). If the next room fails to load,
  // these lines are never shown; that's accepted, because RoomLoader's error
  // message takes over then.
  pendingExitLines: LogEntry[]
  enemies: StoreEnemy[]
  // The items still lying in the room. Copied from room.items on loadRoom
  // (like `enemies` from room.enemies), because room.items is the room file
  // and never changes, while this list loses an item each time the player
  // picks one up.
  items: StoreItem[]
  // Ids of the enemies the player has already seen in this room, so the
  // reveal can say "a skeleton" the first time and "the skeleton" after.
  seenEnemyIds: string[]
  // The exits the player has already seen in this room, as indexes in
  // room.exits (exits have no id), so the reveal can say "An exit" the first
  // time and "The exit" after. Like seenEnemyIds, a room load starts it again.
  seenExitIndexes: number[]
  // The index in room.exits of the exit the player arrived through, or null
  // at the start of a game or when no exit leads back. That exit is announced
  // as "The way back is to the …" and its button says "Go back to the
  // previous room" (decision 11), so it can't be mistaken for the way forward.
  arrivalExitIndex: number | null
  // Ids of the items the player has already seen in this room, so the reveal
  // can say "A gold key" the first time and "The gold key" after, like
  // seenEnemyIds. A room load starts it again.
  seenItemIds: string[]
  // The decor pieces already announced in this room visit, by their key from
  // groupFeaturePieces (e.g. 'pillar@3,0'). Unlike enemies and exits, decor
  // is announced only once per visit (decided Nov 10), so this list decides
  // *whether* a piece is announced, not only the wording. A room load starts
  // it again, so coming back to a room announces its decor again.
  seenPieceKeys: string[]
  // The items picked up and the enemies defeated, in every room so far, as
  // 'room-id/id' (e.g. 'dingy-basement/key-1'). Ids are only unique within
  // a room, so the room id goes in front. loadRoom leaves these out, so a key
  // doesn't lie there again and a defeated guard doesn't come back when the
  // player returns to a room (decided Nov 9). Unlike the seen lists, these
  // are kept across rooms; only a new game (a page reload, for now) clears
  // them. Agent D's saves must save them, together with `inventory`.
  takenItemIds: string[]
  defeatedEnemyIds: string[]
  // The player's accessibility settings (Phase L). Not game state: loading a
  // room, using an exit or a new game never changes them. Agent D saves them
  // on their own, in the `settings` table.
  settings: Settings
  // Changes only the settings passed in, e.g. updateSettings({ highContrast:
  // true }), so the settings dialog can change one control at a time.
  updateSettings: (changes: Partial<Settings>) => void
  // The room the player came from into the current room, or null in the
  // first room of a new game. The save needs it (a save is a checkpoint at
  // that doorway), but arrivingFrom can't do the job: loadRoom sets it back
  // to null. loadRoom copies arrivingFrom here before that.
  enteredFrom: string | null
  // Puts a saved game (Agent D's saves, src/save/) into the store: the saved
  // fields, and the room to load with arrivingFrom, so RoomLoader loads it
  // and the player arrives at the doorway they last came through. `line` is
  // logged with the room's description, e.g. to say a save from another
  // device was loaded; null at start-up, where nothing needs saying.
  restoreSave: (content: SaveContent, line: string | null) => void
  movePlayer: (direction: Direction) => void
  loadRoom: (roomData: unknown, mapData: unknown) => void
  // Use the exit next to the player (Enter on the map, or the exit button).
  takeExit: () => void
  log: LogEntry[]
  player: Combatant
  combat: CombatState | null
  playerAttack: (targetId: string) => void
}

// True between an exit and the next room being loaded. Moving and using
// exits are ignored then: the old room is still on screen, but the player
// has already left it. It's usually a few milliseconds, so a key press in
// that gap is ignored without a log line (the "Loading the room…" status
// in RoomLoader covers a slow connection).
// The id of an item or enemy across the whole dungeon: 'room-id/id'. Used for
// takenItemIds and defeatedEnemyIds, where ids from different rooms are kept
// in one list and 'e1' in one room must not count for 'e1' in another.
function inRoom(roomId: string, id: string): string {
  return `${roomId}/${id}`
}

// The ids (with inRoom) of the items that were in `before` but aren't in
// `after`, i.e. the ones just picked up. includes() can compare the objects
// themselves, because pickUpItems keeps the same item objects in its result.
function pickedUpIds(
  roomId: string,
  before: StoreItem[],
  after: StoreItem[],
): string[] {
  return before
    .filter((item) => !after.includes(item))
    .map((item) => inRoom(roomId, item.id))
}

function isChangingRoom(state: GameState): boolean {
  return state.room !== null && state.room.id !== state.currentRoomId
}

function withIds(log: LogLine[]): LogEntry[] {
  return log.map((line) => ({ ...line, id: crypto.randomUUID() }))
}

function politeEntry(text: string): LogEntry {
  return { id: crypto.randomUUID(), text, urgency: 'polite' }
}

// One log entry per enemy that just came into the light (rule 5), measured
// from where the player stands. Also returns the updated list of seen ids,
// because the store saves both in the same set(). Nothing here changes the
// inputs: map() and the spread build new arrays.
function revealEntries(
  newlyLit: StoreEnemy[],
  from: Position,
  seenEnemyIds: string[],
): { entries: LogEntry[]; seenEnemyIds: string[] } {
  const entries = newlyLit.map((enemy) =>
    politeEntry(
      describeReveal(
        enemy,
        directionFrom(from, enemy.position),
        seenEnemyIds.includes(enemy.id),
      ),
    ),
  )
  // Add only ids that aren't in the list yet, so an enemy is never listed twice.
  const newIds = newlyLit
    .map((enemy) => enemy.id)
    .filter((id) => !seenEnemyIds.includes(id))
  return { entries, seenEnemyIds: [...seenEnemyIds, ...newIds] }
}

// One log entry per item that just came into the light (rule 5), the twin
// of revealEntries for enemies: "A gold key lies to the west." the first
// time, "The gold key…" after. Also returns the updated seen ids, for the
// same set(). directionFrom can't throw here (it throws for the player's own
// tile): the store passes only the items still lying in the room after the
// pickup, and anything on the player's tile has just been picked up.
function itemRevealEntries(
  newlyLit: StoreItem[],
  from: Position,
  seenItemIds: string[],
): { entries: LogEntry[]; seenItemIds: string[] } {
  const entries = newlyLit.map((item) =>
    politeEntry(
      describeItemReveal(
        itemDisplayName(item.type),
        directionFrom(from, item.position),
        seenItemIds.includes(item.id),
      ),
    ),
  )
  // Add only ids that aren't in the list yet, like revealEntries.
  const newIds = newlyLit
    .map((item) => item.id)
    .filter((id) => !seenItemIds.includes(id))
  return { entries, seenItemIds: [...seenItemIds, ...newIds] }
}

// What exitRevealEntries needs. An object instead of six arguments in a row,
// so each call names what it passes and two numbers can't swap places.
type ExitRevealInput = {
  newlyLit: Exit[] // from getNewlyLitExits
  exits: Exit[] // all of the room's exits, to find each one's index
  litAfter: Position[] // the lit tiles after the step
  from: Position // where the player stands now
  seenExitIndexes: number[]
  arrivalExitIndex: number | null
}

// One log entry per exit that just came into the light (rule 5), the twin
// of revealEntries. Also returns the updated seen indexes, for the same set().
// - The direction points at the exit's nearest *lit* tile, so a two-tile door
//   with one half still in the dark points at the half the player can see.
//   The filter can't be empty: getNewlyLitExits only returns an exit if at
//   least one of its tiles is lit. directionFrom can't throw either, because
//   exit tiles are blocked, so the player never stands on one.
// - indexOf finds the exit's index because getNewlyLitExits uses filter(),
//   which returns the same objects that are in room.exits, not copies
//   (reference equality: === on objects asks "the same object?").
// - The way back gets its own line every time (decision 11). It's added to
//   the seen list like the others, which changes nothing for it but keeps
//   one simple rule: every announced exit counts as seen.
function exitRevealEntries({
  newlyLit,
  exits,
  litAfter,
  from,
  seenExitIndexes,
  arrivalExitIndex,
}: ExitRevealInput): { entries: LogEntry[]; seenExitIndexes: number[] } {
  // Each exit paired with its index, so the steps below have both at hand.
  const revealed = newlyLit.map((exit) => ({
    exit,
    index: exits.indexOf(exit),
  }))
  const entries = revealed.map(({ exit, index }) => {
    const litTiles = exit.tiles.filter((tile) => isLit(litAfter, tile))
    const direction = directionFrom(from, nearestTile(litTiles, from))
    const text =
      index === arrivalExitIndex
        ? describeArrivalExit(direction)
        : describeExitReveal(direction, seenExitIndexes.includes(index))
    return politeEntry(text)
  })
  // Add only indexes that aren't in the list yet, like revealEntries.
  const newIndexes = revealed
    .map(({ index }) => index)
    .filter((index) => !seenExitIndexes.includes(index))
  return { entries, seenExitIndexes: [...seenExitIndexes, ...newIndexes] }
}

// The decor lines for one step (Phase K step 7), with the updated seen keys
// for the same set(). All decor reveals are made here and nowhere else, so
// Phase L's brief verbosity can switch them off in one place (it skips decor
// reveals, never enemy or exit reveals).
// - The pieces are grouped from the room's features on every call instead of
//   being kept in the store: they follow from `features`, so keeping them
//   too would be a second copy of the same facts (rule 2). Grouping at most
//   120 cells is cheap.
// - One line per name and direction (groupFeatureReveals), all polite.
function featureRevealEntries(
  features: Feature[],
  litAfter: Position[],
  from: Position,
  seenPieceKeys: string[],
): { entries: LogEntry[]; seenPieceKeys: string[] } {
  const newlyLit = getNewlyLitPieces(
    groupFeaturePieces(features),
    litAfter,
    seenPieceKeys,
  )
  const entries = groupFeatureReveals(newlyLit, litAfter, from).map((group) =>
    politeEntry(
      describeFeatureReveal(group.name, group.count, group.direction),
    ),
  )
  // getNewlyLitPieces only returns unseen pieces, so no key is added twice.
  return {
    entries,
    seenPieceKeys: [...seenPieceKeys, ...newlyLit.map((piece) => piece.key)],
  }
}

// A factory, so every test can get its own fresh store instead of sharing one.
// initialSettings is a parameter for the same reason as random: a test can
// start with the settings it needs. The default asks the operating system
// about reduced motion once, when the store is created.
export function createGameStore(
  random: () => number = Math.random,
  initialSettings: Settings = defaultSettings(osPrefersReducedMotion()),
) {
  return createStore<GameState>()((set, get) => ({
    // Nothing is loaded yet: null means "no room", unlike [] or { x: 0, y: 0 },
    // which would look like real data.
    log: [],
    playerPosition: null,
    grid: null,
    features: [],
    room: null,
    tiledMap: null,
    currentRoomId: FIRST_ROOM_ID,
    arrivingFrom: null,
    inventory: [],
    hasEscaped: false,
    pendingExitLines: [],
    enemies: [],
    items: [],
    seenEnemyIds: [],
    seenExitIndexes: [],
    arrivalExitIndex: null,
    seenItemIds: [],
    seenPieceKeys: [],
    takenItemIds: [],
    defeatedEnemyIds: [],
    player: PLAYER,
    combat: null,
    settings: initialSettings,
    updateSettings: (changes) => {
      // Spread the old settings first, then the changes on top: a field in
      // `changes` wins, and every field not in it stays as it was.
      // Parsed with the schema because Partial<Settings> also allows
      // `{ highContrast: undefined }` (our tsconfig doesn't turn on
      // exactOptionalPropertyTypes), which would wipe a setting without a
      // type error. A wrong value is a bug in the caller, so it throws here
      // instead of reaching Phaser or the save.
      set({
        settings: settingsSchema.parse({ ...get().settings, ...changes }),
      })
    },
    enteredFrom: null,
    restoreSave: (content, line) => {
      const { room, tiledMap, currentRoomId } = get()
      // Is the saved room the one already on screen (and not in the middle
      // of an exit)? Then currentRoomId won't change, so RoomLoader won't
      // fetch anything, and the room is loaded again here instead, from the
      // files already in the store. Otherwise RoomLoader does it, as for an
      // exit.
      const reloadHere =
        room !== null &&
        tiledMap !== null &&
        room.id === currentRoomId &&
        room.id === content.currentRoomId
      set({
        currentRoomId: content.currentRoomId,
        // arrivingFrom places the player at the doorway when the room
        // loads; enteredFrom is set too, so the store is right even before.
        arrivingFrom: content.enteredFrom,
        enteredFrom: content.enteredFrom,
        // The saved health on top of the player's stats, which never change.
        player: { ...PLAYER, currentHealth: content.health },
        inventory: content.inventory,
        takenItemIds: content.takenItemIds,
        defeatedEnemyIds: content.defeatedEnemyIds,
        // A save is never made after the game has ended or during a fight.
        hasEscaped: false,
        combat: null,
        // loadRoom logs these together with the room's description, in one
        // batch (see pendingExitLines). Any exit lines still waiting belong
        // to the game being replaced, so they go.
        pendingExitLines: line === null ? [] : [politeEntry(line)],
      })
      if (reloadHere) {
        // room and tiledMap were checked when they were first loaded, so
        // checking them again in loadRoom passes.
        get().loadRoom(room, tiledMap)
      }
    },
    loadRoom: (roomData, mapData) => {
      const { grid, features, room, tiledMap } = loadRoomFromFiles(
        roomData,
        mapData,
      )
      const text = room.description
      const {
        log,
        arrivingFrom,
        pendingExitLines,
        inventory,
        takenItemIds,
        defeatedEnemyIds,
      } = get()
      // Spawn every enemy in the room file first, then leave out the ones
      // already defeated. In that order, the names stay the same: with two
      // skeletons, "skeleton 2" is still "skeleton 2" after "skeleton" was
      // defeated. Filtering before spawning would rename it "skeleton".
      const enemies = spawnEnemies(room.enemies).filter(
        (enemy) => !defeatedEnemyIds.includes(inRoom(room.id, enemy.id)),
      )
      // The room's items, minus the ones already picked up on an earlier visit.
      const roomItems = room.items.filter(
        (item) => !takenItemIds.includes(inRoom(room.id, item.id)),
      )
      // At the doorway that leads back where the player came from, or at
      // playerStart in a new game (arrivingFrom is null). Enemy tiles are
      // passed so the player is never placed on top of an enemy.
      const start = findArrivalPosition(
        grid,
        room.exits,
        room.playerStart,
        arrivingFrom,
        enemies.map((enemy) => enemy.position),
      )
      // nothing was lit before the room existed
      const litBefore: Position[] = []
      const litAfter = getVisibleTiles(grid, start, LANTERN_RADIUS)
      // A new room starts with nobody seen ([]), so ids from the last room
      // (which can repeat, e.g. 'e1') don't count.
      const reveal = revealEntries(
        getNewlyLit(litBefore, litAfter, enemies),
        start,
        [],
      )
      // Read before set(), while arrivingFrom still names the room just left.
      // The same lookup findArrivalPosition uses, so the exit the player
      // stands next to is the one the log calls the way back.
      const arrivalExitIndex = findExitBackIndex(room.exits, arrivingFrom)
      // The new room's exits start unseen ([]), like its enemies.
      const exitReveal = exitRevealEntries({
        newlyLit: getNewlyLitExits(litBefore, litAfter, room.exits),
        exits: room.exits,
        litAfter,
        from: start,
        seenExitIndexes: [],
        arrivalExitIndex,
      })
      // The room's items, minus anything lying right where the player starts.
      // A room file shouldn't put an item there, but if one does, the player
      // picks it up on arrival, the same as stepping onto it. Otherwise the
      // reveal below would ask for the direction to the player's own tile
      // (directionFrom throws), and the item could only be picked up by
      // stepping off and back on.
      const pickUp = pickUpItems(roomItems, start, inventory)
      // The new room's items start unseen ([]), like its enemies and exits.
      const itemReveal = itemRevealEntries(
        getNewlyLitItems(litBefore, litAfter, pickUp.items),
        start,
        [],
      )
      // The new room's decor starts unseen ([]), like everything above.
      const featureReveal = featureRevealEntries(features, litAfter, start, [])
      set({
        grid,
        features,
        playerPosition: start,
        room,
        tiledMap,
        // The loaded room is now the current one, and the arrival is done.
        // Setting currentRoomId here too keeps the two in step when loadRoom
        // is called directly (as the tests do).
        currentRoomId: room.id,
        // Remembered for the save before arrivingFrom is cleared.
        enteredFrom: arrivingFrom,
        arrivingFrom: null,
        enemies,
        items: pickUp.items,
        inventory: pickUp.inventory,
        takenItemIds: [
          ...takenItemIds,
          ...pickedUpIds(room.id, roomItems, pickUp.items),
        ],
        seenEnemyIds: reveal.seenEnemyIds,
        seenExitIndexes: exitReveal.seenExitIndexes,
        seenItemIds: itemReveal.seenItemIds,
        seenPieceKeys: featureReveal.seenPieceKeys,
        arrivalExitIndex,
        // One batch for the whole room change: the exit lines (empty at the
        // start of a game), then the description, then a pickup (almost
        // always none), then the enemy reveals, then the exit reveals
        // (decided Nov 6), then the item reveals (Nov 8), then the decor
        // reveals (Nov 10, last because they matter least). The pickup comes
        // right after the description for the same reason it comes right
        // after the step in movePlayer: first what happens to the player,
        // then what the light shows.
        log: [
          ...log,
          ...pendingExitLines,
          politeEntry(text),
          ...withIds(pickUp.lines),
          ...reveal.entries,
          ...exitReveal.entries,
          ...itemReveal.entries,
          ...featureReveal.entries,
        ],
        pendingExitLines: [],
        combat: null, // loading a new room ends any fight in progress
      })
    },
    takeExit: () => {
      const state = get()
      const { playerPosition, room, combat, inventory, player, log } = state
      // No room loaded yet, or the next room is still loading: nothing to use.
      if (playerPosition === null || room === null) return
      if (isChangingRoom(state)) return

      // The game is over, lost or won: the player can't act any more.
      if (player.currentHealth <= 0) {
        set({ log: [...log, politeEntry(FALLEN_TEXT)] })
        return
      }
      if (state.hasEscaped) {
        set({ log: [...log, politeEntry(describeAlreadyEscaped())] })
        return
      }

      // exitStep decides everything (fight, no exit, lock, final exit) and
      // the store only saves the result, like the combat steps.
      const step = exitStep({
        position: playerPosition,
        exits: room.exits,
        inCombat: combat !== null,
        inventory,
        player,
      })
      const lines = withIds(step.lines)

      switch (step.kind) {
        case 'stay':
          set({ log: [...log, ...lines] })
          return
        case 'escape':
          set({ hasEscaped: true, log: [...log, ...lines] })
          return
        case 'leave':
          // Changing currentRoomId is what makes RoomLoader fetch the next
          // room. The heal happens here, not in loadRoom, so loading a room
          // in another way (e.g. a save later) doesn't heal (decided Nov 3).
          // The lines are not logged yet: loadRoom logs them together with
          // the new room's description (see pendingExitLines).
          set({
            player: step.player,
            currentRoomId: step.to,
            arrivingFrom: room.id,
            pendingExitLines: lines,
          })
          return
      }
    },
    movePlayer: (direction) => {
      const {
        playerPosition,
        grid,
        features,
        room,
        enemies,
        items,
        inventory,
        seenEnemyIds,
        seenExitIndexes,
        seenItemIds,
        seenPieceKeys,
        arrivalExitIndex,
        takenItemIds,
        log,
        player,
        combat,
      } = get()
      // No room loaded yet, so there's nowhere to move and nothing to narrate.
      // After this check, TypeScript knows none of them is null (narrowing).
      // loadRoom sets all three together, so checking room too costs nothing,
      // and the code below can use room.id and room.exits directly.
      if (playerPosition === null || grid === null || room === null) return

      // The player has gone through an exit and the next room is loading.
      if (isChangingRoom(get())) return

      // Game over: the player can't act any more.
      if (player.currentHealth <= 0) {
        set({
          log: [...log, politeEntry(FALLEN_TEXT)],
        })
        return
      }

      // Won: the player has left the dungeon, so there's nothing to move in.
      if (get().hasEscaped) {
        set({ log: [...log, politeEntry(describeAlreadyEscaped())] })
        return
      }

      // In a fight: moving is not allowed (fleeing is a later Could).
      if (combat) {
        set({
          log: [...log, politeEntry('You are in a fight and cannot move.')],
        })
        return
      }

      // Enemies are solid, so movement needs to know which tiles they stand on.
      const enemyPositions = enemies.map((enemy) => enemy.position)
      // Every tile of every exit, so walking into one says how to use it.
      // flatMap turns the list of exits (each with a list of tiles) into one
      // flat list of tiles.
      const exits = room.exits
      const exitTiles = exits.flatMap((exit) => exit.tiles)
      const result = computeMove(
        playerPosition,
        direction,
        grid,
        enemyPositions,
        exitTiles,
        // So walking into a barrel says "A barrel blocks your path."
        features,
      )
      const text = describeMove(result, direction)

      const moveEntry = politeEntry(text)

      // Stepping onto an item picks it up (decision 8). Items don't block
      // movement, so computeMove doesn't need to know about them. Only a step
      // that happened can pick something up: a blocked move stays on a tile
      // whose items were already picked up when the player got there.
      const pickUp = result.moved
        ? pickUpItems(items, result.newPosition, inventory)
        : { items, inventory, lines: [] }
      const pickUpEntries = withIds(pickUp.lines)
      // Remember what was picked up, so it isn't there when the player comes
      // back to this room. The same array when nothing was picked up.
      const newlyTaken = pickedUpIds(room.id, items, pickUp.items)
      const nextTakenItemIds =
        newlyTaken.length === 0
          ? takenItemIds
          : [...takenItemIds, ...newlyTaken]

      // What the lantern lights before and after the step. A blocked move has
      // the same position in both, so it reveals nothing without a special case.
      const litBefore = getVisibleTiles(grid, playerPosition, LANTERN_RADIUS)
      const litAfter = getVisibleTiles(grid, result.newPosition, LANTERN_RADIUS)

      // The reveal lines are added to the log together with the step line in
      // the single set() below.
      const reveal = revealEntries(
        getNewlyLit(litBefore, litAfter, enemies),
        result.newPosition,
        seenEnemyIds,
      )
      const exitReveal = exitRevealEntries({
        newlyLit: getNewlyLitExits(litBefore, litAfter, exits),
        exits,
        litAfter,
        from: result.newPosition,
        seenExitIndexes,
        arrivalExitIndex,
      })
      // Items that came into the light. pickUp.items, not items: an item the
      // player has just picked up isn't lying anywhere to be announced.
      const itemReveal = itemRevealEntries(
        getNewlyLitItems(litBefore, litAfter, pickUp.items),
        result.newPosition,
        seenItemIds,
      )
      // Decor that came into the light for the first time in this visit.
      const featureReveal = featureRevealEntries(
        features,
        litAfter,
        result.newPosition,
        seenPieceKeys,
      )

      // Only a step that actually happened can start a fight. A blocked move
      // means you're standing where you were.
      const adjacent = result.moved
        ? getAdjacentEnemies(result.newPosition, enemies)
        : []

      if (adjacent.length === 0) {
        // The exit this step has put the player next to, if any. Only here,
        // where no fight starts: in a fight the exit can't be used, so
        // "Press Enter to use it" would be wrong.
        const nextTo = findNewlyAdjacentExit(
          playerPosition,
          result.newPosition,
          exits,
        )
        const nextToEntries = nextTo
          ? [
              politeEntry(
                describeNextToExit(
                  exits.indexOf(nextTo.exit) === arrivalExitIndex,
                  nextTo.direction,
                ),
              ),
            ]
          : []
        set({
          playerPosition: result.newPosition,
          items: pickUp.items,
          inventory: pickUp.inventory,
          takenItemIds: nextTakenItemIds,
          seenEnemyIds: reveal.seenEnemyIds,
          seenExitIndexes: exitReveal.seenExitIndexes,
          seenItemIds: itemReveal.seenItemIds,
          seenPieceKeys: featureReveal.seenPieceKeys,
          // Step, then the pickup (Nov 8), then enemy reveals, then exit
          // reveals (decided Nov 6), then item reveals (Nov 8), then decor
          // reveals (Nov 10), then the exit next to the player (Nov 8). The
          // pickup sits right after the step because it's part of the step:
          // the player stepped onto the key.
          // "You are next to the exit… Press Enter" stays last, because it's
          // the cue to act, like "It's your turn." in a fight.
          log: [
            ...log,
            moveEntry,
            ...pickUpEntries,
            ...reveal.entries,
            ...exitReveal.entries,
            ...itemReveal.entries,
            ...featureReveal.entries,
            ...nextToEntries,
          ],
        })
        return
      }

      const step = beginCombat(player, enemies, adjacent, random)
      set({
        playerPosition: result.newPosition,
        player: step.player,
        enemies: step.enemies,
        combat: step.combat,
        items: pickUp.items,
        inventory: pickUp.inventory,
        takenItemIds: nextTakenItemIds,
        seenEnemyIds: reveal.seenEnemyIds,
        seenExitIndexes: exitReveal.seenExitIndexes,
        seenItemIds: itemReveal.seenItemIds,
        seenPieceKeys: featureReveal.seenPieceKeys,
        // Step, then the pickup, then enemy reveals, then exit reveals, then
        // item reveals, then decor reveals, then the fight start (decided
        // Nov 4 and Nov 6, items Nov 8, decor Nov 10). A step can pick up a key and start a fight at once: the key
        // is picked up first, because the player is already standing on it
        // when the enemy attacks, and the fight lines end with "It's your
        // turn.", the cue to act, so they must come last.
        log: [
          ...log,
          moveEntry,
          ...pickUpEntries,
          ...reveal.entries,
          ...exitReveal.entries,
          ...itemReveal.entries,
          ...featureReveal.entries,
          ...withIds(step.lines),
        ],
      })
    },

    playerAttack: (targetId) => {
      const { combat, enemies, log, room, defeatedEnemyIds, inventory } = get()
      // No game-over check needed: when the player falls, finishStep sets combat
      // to null, so the check below already covers it. room can't be null in
      // a fight, but the check lets TypeScript use room.id below.
      if (!combat || room === null) return
      const step = playerAttackStep(combat, enemies, targetId, random)
      // playerAttackStep removes an enemy from the list when it dies, so the
      // ones missing afterwards are the ones just defeated. Remember them, so
      // they don't come back when the player returns to this room.
      const defeated = enemies
        .filter((enemy) => !step.enemies.some((e) => e.id === enemy.id))
        .map((enemy) => inRoom(room.id, enemy.id))
      set({
        player: step.player,
        enemies: step.enemies,
        combat: step.combat,
        defeatedEnemyIds:
          defeated.length === 0
            ? defeatedEnemyIds
            : [...defeatedEnemyIds, ...defeated],
        // What the defeated enemies carried (the mimic's gold key) goes
        // straight into the inventory, like a key picked up from the floor
        // (decided Nov 9). The same array when nothing was dropped.
        inventory:
          step.loot.length === 0 ? inventory : [...inventory, ...step.loot],
        log: [...log, ...withIds(step.lines)],
      })
    },
  }))
}

// The one shared store the app uses. Phaser and React both import this.
export const gameStore = createGameStore()
