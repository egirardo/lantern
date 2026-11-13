import { AdventureLog } from './AdventureLog'
import { CombatMenu } from './CombatMenu'
import { EndCard } from './EndCard'
import { ExitButton } from './ExitButton'
import { Goal } from './Goal'
import { HealthDisplay } from './HealthDisplay'
import { Inventory } from './Inventory'
import { PhaserGame } from './PhaserGame'
import { RoomLoader } from './RoomLoader'

// The game screen (mockup section 1), below the header. The DOM order is the
// visual order, row by row, so Tab and a screen reader follow what's on
// screen:
// 1. the map, and beside it the adventure log with Your turn (or the end
//    card) under it;
// 2. under the map: health and the exit button;
// 3. Inventory and Goal.
//
// Your turn sits beside the map, not in the bottom row (changed Nov 13): a
// fight moves focus to its first attack button, and in the bottom row a
// laptop window had to scroll to show the button, which pushed the top of
// the map out of view. Beside the map, the button is in view whenever the
// map is. It also follows the log in the reading order, so a screen reader
// user hears the fight's log lines, then the buttons.
export function GameScreen() {
  return (
    <>
      {/* No room id here: RoomLoader reads it from the store, so an exit can
          change the room. */}
      <RoomLoader />
      <div className="play">
        <div className="map-frame">
          <PhaserGame />
        </div>
        <div className="log-column">
          <AdventureLog />
          {/* The turn slot keeps its place when there's no fight (the menu
              then shows an idle box), so the log doesn't change size when a
              fight starts or ends. The combat menu and the end card are
              never shown at the same time: a fight is over before the game
              ends. */}
          <div className="turn-slot">
            <CombatMenu />
            <EndCard />
          </div>
        </div>
      </div>
      <div className="hud">
        <HealthDisplay />
        <ExitButton />
      </div>
      <div className="below">
        <Inventory />
        <Goal />
      </div>
    </>
  )
}
