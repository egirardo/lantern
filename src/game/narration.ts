import { type Direction, type MoveResult, type BlockedReason } from './movement'
import {
  PLAYER_ID,
  type Combatant,
  type CombatEvent,
  type CombatState,
} from './combat'
import type { CompassDirection } from './compass'
import type { StoreEnemy } from './spawn-enemies'

// Record requires an entry for every BlockedReason, so adding a new reason
// without a corresponding message is a type error instead of a silent default.
// 'exit' and 'feature' are left out with Exclude: their lines need the
// direction or the name, so describeMove writes them separately.
const BLOCKED_TEXT: Record<
  Exclude<BlockedReason, 'exit' | 'feature'>,
  string
> = {
  wall: 'A wall blocks your path',
  edge: 'The edge of the world blocks your path',
  enemy: 'An enemy blocks your path',
}

function isPlayer(id: string): boolean {
  return id === PLAYER_ID
}

function getName(state: CombatState, id: string): string {
  if (isPlayer(id)) {
    return state.player.name
  }
  const enemy = state.enemies.find((e) => e.id === id)
  if (!enemy) {
    throw new Error(`No combatant with id ${id}`)
  }
  return enemy.combatant.name
}

function describeRoll(natural: number, total: number): string {
  const bonus = total - natural
  if (bonus >= 0) {
    return `${natural} + ${bonus} = ${total}`
  } else {
    return `${natural} - ${Math.abs(bonus)} = ${total}`
  }
}

// The three helpers below turn an id into words. The player is "you" and an
// enemy is "the skeleton". English also changes the verb with the subject
// ("You hit", "The skeleton hits"), so every sentence goes through them
// instead of using the raw name.

// For the start of a sentence: "You" or "The skeleton".
function subject(state: CombatState, id: string): string {
  return isPlayer(id) ? 'You' : `The ${getName(state, id)}`
}

// For after the verb: "you" or "the skeleton".
function object(state: CombatState, id: string): string {
  return isPlayer(id) ? 'you' : `the ${getName(state, id)}`
}

// Both forms are written out, because some verbs don't follow a rule
// ("miss" becomes "misses", "are" becomes "is").
function verb(id: string, playerForm: string, enemyForm: string): string {
  return isPlayer(id) ? playerForm : enemyForm
}

export function describeCombatEvent(
  state: CombatState,
  event: CombatEvent,
): string {
  switch (event.type) {
    case 'attack': {
      const { attackerId, targetId, result } = event
      const who = subject(state, attackerId)
      const target = object(state, targetId)
      // The numbers: what was rolled, and what it had to beat to hit.
      const roll = `${describeRoll(result.naturalRoll, result.total)} against armor class ${result.opposingArmorClass}`
      if (result.hit) {
        if (result.natural20) {
          return `${who} ${verb(attackerId, 'roll', 'rolls')} a natural 20 and ${verb(attackerId, 'land', 'lands')} a critical hit on ${target} for ${result.damage} damage!`
        }
        return `${who} ${verb(attackerId, 'hit', 'hits')} ${target} for ${result.damage} damage (${roll}).`
      }
      if (result.natural1) {
        return `${who} ${verb(attackerId, 'roll', 'rolls')} a natural 1 and ${verb(attackerId, 'miss', 'misses')} ${target}!`
      }
      return `${who} ${verb(attackerId, 'miss', 'misses')} ${target} (${roll}).`
    }
    case 'initiative': {
      const { combatantId, initiativeRoll } = event
      return `${subject(state, combatantId)} ${verb(combatantId, 'roll', 'rolls')} initiative: ${describeRoll(
        initiativeRoll.naturalRoll,
        initiativeRoll.total,
      )}.`
    }
    case 'defeated': {
      const { combatantId } = event
      // The player "falls" instead of "is defeated", so the next line
      // ("Defeat. Game over…") doesn't repeat the same word, and it matches
      // the visible game over message ("You have fallen…").
      if (combatantId === PLAYER_ID) return 'You have fallen.'
      return `${subject(state, combatantId)} ${verb(combatantId, 'are', 'is')} defeated.`
    }
    case 'combat-ended': {
      return event.outcome === 'victory'
        ? 'Victory. No enemies are left standing.'
        : // The game over message is a log line too, so a screen reader hears
          // it in the same batch as the killing blow. Moving focus to a
          // separate message dropped that batch in VoiceOver (tested Nov 4).
          'Defeat. Game over. Reload the page to try again.'
    }
  }
}

export function describeMove(result: MoveResult, direction: Direction): string {
  if (result.moved) {
    return `You have taken a step to the ${direction}.`
  }
  // Walking into an exit isn't a mistake, so the line doesn't start with
  // "You cannot move". It says where the exit is and how to use it.
  // "exit" (not "door") because a room file doesn't say whether an exit is
  // a door or a ladder; the room description does.
  if (result.reason === 'exit') {
    return `An exit leads ${direction}. Press Enter to use it.`
  }
  // A named wall, e.g. a barrel (Phase K step 3). The same start as the wall
  // line, so the player hears the direction first, then what is there.
  // TypeScript only allows result.name inside this check: narrowing on
  // `reason` picks the one MoveResult case that has a name.
  if (result.reason === 'feature') {
    const name = featureDisplayName(result.name)
    return `You cannot move to the ${direction}. ${capitalise(`${indefiniteArticle(name)} ${name}`)} blocks your path.`
  }
  // TypeScript knows result.reason is neither 'exit' nor 'feature' here, so
  // it allows the lookup in BLOCKED_TEXT, which has no entry for them.
  return `You cannot move to the ${direction}. ${BLOCKED_TEXT[result.reason]}.`
}

// A feature name as the log says it: the table uses kebab-case
// ('wooden-table'), but a screen reader should hear "wooden table", not
// "wooden dash table".
function featureDisplayName(name: string): string {
  return name.replaceAll('-', ' ')
}

// The one assertive announcement in the game (see low-health.ts for when it
// fires). "Low health" comes first because an assertive message interrupts
// the screen reader, so the first words should say why. "health" is written
// out, not "HP", because screen readers spell out abbreviations.
export function describeLowHealth(player: Combatant): string {
  return `Low health warning: you have ${player.currentHealth} out of ${player.maxHealth} health remaining.`
}

// The polite line after a won fight. `player` is the player before healing,
// and `amountRecovered` is what recoverHealth actually added after the cap
// (0 to RECOVERY_AMOUNT), so the sentence never claims more than happened.
// This function doesn't cap anything itself: the healing rule lives in
// recovery.ts, and narration only puts it into words.
export function describeRecovery(
  player: Combatant,
  amountRecovered: number,
): string {
  const total = `You have ${player.currentHealth + amountRecovered} out of ${player.maxHealth} health.`

  // "Catch your breath" only when something was actually recovered (your
  // rule, Nov 3). Already at full, the player still gets a line, so every
  // won fight ends the same way and the total is always announced.
  if (amountRecovered > 0) {
    return `You catch your breath and recover ${amountRecovered} health. ${total}`
  } else {
    return `You recover 0 health. ${total}`
  }
}

// The last line of every combat step where the fight goes on: the cue for a
// screen reader user that the enemies are done and they can act. It's read
// right before focus moves to the attack buttons (Phase J decision 5).
export function describeYourTurn(): string {
  return "It's your turn."
}

// One button in the combat menu: `id` is what the button passes to
// playerAttack (and React's key), `label` is the button text and the name a
// screen reader reads out.
export type AttackOption = { id: string; label: string }

// The attack buttons for the current fight, one per living enemy, in the
// order of `combat.enemies` so the buttons don't move around between turns.
export function getAttackOptions(combat: CombatState): AttackOption[] {
  return (
    combat.enemies
      // Defeated enemies stay in the combat state with 0 health, so the log
      // can still name them. They must not get a button: attacking one
      // throws. `> 0` is the same "alive" rule as getCombatStatus.
      .filter((entry) => entry.combatant.currentHealth > 0)
      // object() gives "the skeleton 1", exactly the words the log uses
      // ("You hit the skeleton 1…"), so the button and the log always match.
      .map((entry) => ({
        id: entry.id,
        label: `Attack ${object(combat, entry.id)}`,
      }))
  )
}

// The first line of a fight, before any dice: who attacks, in plain words.
// Without it, a screen reader user hears a step and then initiative numbers,
// and has to work out from a roll line that a fight started (rule 5).
// Every enemy in a new fight is alive and next to the player, so this reads
// all of `combat.enemies`. Names come from subject() and object(), so they
// match the rest of the log ("The skeleton 1", "the orc").
export function describeCombatStart(combat: CombatState): string {
  const ids = combat.enemies.map((entry) => entry.id)
  // A fight always has at least one enemy. If not, the caller has a bug.
  if (ids.length === 0) {
    throw new Error('A fight needs at least one enemy')
  }

  // "The skeleton", "The skeleton and the orc", or "The skeleton, the orc
  // and the demon": the first name starts the sentence, the rest are joined
  // with commas and a final "and".
  const names = ids.map((id, index) =>
    index === 0 ? subject(combat, id) : object(combat, id),
  )
  const attackers =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

  // English changes the verb with the number of attackers.
  const verb = names.length === 1 ? 'attacks' : 'attack'
  return `${attackers} ${verb} you! A fight begins.`
}

// Announces an enemy that has just come into the lantern light (rule 5: the
// canvas now shows it, so the log must say so too). The store calls this once
// for each enemy from getNewlyLit, with the direction from directionFrom.
// - The name comes from combatant.name, not type, so two skeletons are told
//   apart as "skeleton 1" and "skeleton 2", the same names the combat log and
//   the attack menu use.
// - First sighting: "A skeleton appears to the west." / "An orc appears…".
//   Coming back into the light: "The skeleton appears…", so a screen reader
//   user doesn't think it's a second skeleton (decided Nov 4).
// - A numbered name works like a proper name and gets no article:
//   "Skeleton 1 appears to the west." The number already says which one.
export function describeReveal(
  enemy: StoreEnemy,
  direction: CompassDirection,
  seenBefore: boolean,
): string {
  return `${nameWithArticle(enemy.combatant.name, seenBefore)} appears to the ${direction}.`
}

// Announces an exit that has just come into the lantern light, with the
// direction from the player (the store calls this for each exit from
// getNewlyLitExits). Same rules as describeReveal, decided Nov 6: "An exit"
// the first time, "The exit" when it comes back into the light, so a screen
// reader user knows it's the same one. A separate function from
// describeReveal, because an exit has no name and can't be numbered.
export function describeExitReveal(
  direction: CompassDirection,
  seenBefore: boolean,
): string {
  const article = seenBefore ? 'The' : 'An'
  return `${article} exit appears to the ${direction}.`
}

// Announces the exit the player arrived through, each time it comes into the
// light (decision 11, Nov 8). It gets its own line instead of "An exit", so a
// player who can't see the canvas can tell the way back from the way forward
// and doesn't loop between two rooms. "is", not "appears": the player has
// just come through it. No seenBefore: it's the same line every time.
export function describeArrivalExit(direction: CompassDirection): string {
  return `The way back is to the ${direction}.`
}

// The text on the exit button (decision 11). The way back says so, with no
// direction: the button only shows while the player stands next to that
// exit, so where it is doesn't matter. Other exits keep the direction, the
// same word the log uses when the player walks into the exit. Not "next room",
// because the game knows where the player came from, not which way is forward.
// The button passes a straight Direction ('north'), which TypeScript accepts
// here because every Direction is also a CompassDirection.
export function exitButtonLabel(
  isWayBack: boolean,
  direction: CompassDirection,
): string {
  if (isWayBack) return 'Go back to the previous room'
  return `Use the exit to the ${direction}`
}

// The line when a step puts the player next to an exit (from
// findNewlyAdjacentExit). The exit button appears at the same moment, but
// silently, so this is how a screen reader user learns they can use the exit
// now (decided Nov 8). It names the way back like the other lines
// (decision 11), and says which key to press, like the line for walking into
// an exit.
export function describeNextToExit(
  isWayBack: boolean,
  direction: CompassDirection,
): string {
  const exit = isWayBack
    ? `the way back, to the ${direction}`
    : `the exit to the ${direction}`
  return `You are next to ${exit}. Press Enter to use it.`
}

// --- Items (Nov 8, Agent E) ---

// The line when the player steps onto an item and picks it up (decision 8).
// `itemName` is the display name from items.json, e.g. "gold key". "a" or
// "an" by the same spelling rule as the enemies ("an amulet" would work too).
export function describePickUp(itemName: string): string {
  return `You pick up ${indefiniteArticle(itemName)} ${itemName}.`
}

// Announces an item that has just come into the lantern light, like
// describeReveal for enemies and describeExitReveal for exits (rule 5: an item
// drawn on the canvas must also be in the log). "A gold key" the first time,
// "The gold key" when it comes back into the light, so a screen reader user
// knows it's the same key. "lies", not "appears": an item doesn't move, so it
// was there all along and the light only shows it.
// Items have no numbered names (only enemies get "skeleton 2"), so this uses
// the article rule directly instead of nameWithArticle.
export function describeItemReveal(
  itemName: string,
  direction: CompassDirection,
  seenBefore: boolean,
): string {
  const article = seenBefore ? 'the' : indefiniteArticle(itemName)
  return `${capitalise(`${article} ${itemName}`)} lies to the ${direction}.`
}

// spawnEnemies only adds a number when a room has two of the same type
// ("skeleton 2"), so a name ending in " <digits>" is a numbered name.
// The regex: \s = a space, \d+ = one or more digits, $ = end of the string.
function isNumbered(name: string): boolean {
  return /\s\d+$/.test(name)
}

// "an" before a vowel, otherwise "a". This is a spelling rule, and English
// goes by sound, so it would be wrong for e.g. "hour" or "unicorn". It's right
// for every enemy we have (skeleton, demon, orc). If a new type breaks it,
// add an article field to enemies.json instead.
function indefiniteArticle(name: string): string {
  return /^[aeiou]/i.test(name) ? 'an' : 'a'
}

// The sentence starts with the name, so the first letter is capitalised.
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function nameWithArticle(name: string, seenBefore: boolean): string {
  if (isNumbered(name)) return capitalise(name)
  const article = seenBefore ? 'the' : indefiniteArticle(name)
  return capitalise(`${article} ${name}`)
}

// --- Exits (Fri Nov 6) ---
// The lines for using an exit. exitStep in exits.ts decides which ones are
// said; these functions only hold the words, like the combat lines above.

// The player tries to use an exit during a fight. Moving is blocked in a
// fight, so leaving through a door is too.
export function describeExitInFight(): string {
  return "You can't leave during a fight."
}

// The player pressed Enter (or the exit button) but isn't standing next to
// an exit. Without a line, the key press would seem to do nothing.
export function describeNoExitNearby(): string {
  return 'There is no exit next to you.'
}

// The exit needs an item the player doesn't carry. Says "key" because the
// only item an exit can need is a key (decision 8).
export function describeLocked(): string {
  return 'The door is locked. You need a key.'
}

// The player carries the item, so the locked exit opens. `itemName` is the
// display name from items.json, e.g. "gold key".
export function describeUnlock(itemName: string): string {
  return `You unlock the door with the ${itemName}.`
}

// The player goes through an exit to another room. Said before the new
// room's description, so a screen reader user knows the room is changing.
export function describeGoThrough(direction: Direction): string {
  return `You go through the exit to the ${direction}.`
}

// The full heal on going through an exit (decided Nov 3). `player` is the
// player after healing. The total is always said, like after a won fight.
export function describeFullHealth(player: Combatant): string {
  return `You recover to full health. You have ${player.currentHealth} out of ${player.maxHealth} health.`
}

// The player uses the final exit and wins. The visible victory message says
// the same, so the log carries the whole message (like game over).
export function describeEscape(): string {
  return 'Victory! You climb out of the dungeon. Reload the page to play again.'
}

// The player tries to move or use an exit after winning.
export function describeAlreadyEscaped(): string {
  return 'You have already escaped the dungeon.'
}
