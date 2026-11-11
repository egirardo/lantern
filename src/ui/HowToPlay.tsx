// The How to play pages of the book. Only what the game really does: the keys
// come from PhaserGame.tsx and key-to-direction.ts, the exit button from
// ExitButton.tsx, the fight from CombatMenu.tsx and the store.
//
// Two pages, like an open book: the left page starts with the tab's name as
// its heading (h2), the subjects are h3, so a screen reader user can jump
// between them with the heading keys.
export function HowToPlay() {
  return (
    <>
      <div className="book-page">
        <h2 className="page-banner">How to play</h2>
        <h3>Moving</h3>
        <p>
          The map must have focus for the keys to work. Start or Continue puts
          you there, or you can tab to the map.
        </p>
        <p>
          Press the arrow keys to move one step north, south, east or west.
          Every step is one turn. Nothing happens until you act, so take your
          time.
        </p>
        <p>
          Your lantern only lights the tiles close to you. The adventure log
          tells you what comes into the light, and in which direction.
        </p>
        <h3>Exits</h3>
        <p>
          When you stand next to an exit, the log says so. Press Enter to use
          it, or press the exit button under the map. Going through an exit
          heals you to full health.
        </p>
      </div>
      <div className="book-page">
        <h3>Fighting</h3>
        <p>
          A fight starts when you step next to an enemy. Focus moves to the
          attack buttons under the map: choose the enemy to attack.
        </p>
        <p>
          You and the enemies take turns, and dice decide every hit. The log
          tells you each roll and how much health you have left.
        </p>
        <h3>The goal</h3>
        <p>
          Somewhere in the dungeon is a gold key. Find it, then find the great
          door and unlock it to escape.
        </p>
        <p>
          The Goal panel under the map shows your next step, and Inventory shows
          what you carry.
        </p>
      </div>
    </>
  )
}
