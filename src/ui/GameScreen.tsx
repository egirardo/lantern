import { ActionsPanel } from './ActionsPanel'
import { AdventureLog } from './AdventureLog'
import { EndCard } from './EndCard'
import { Goal } from './Goal'
import { HealthPanel } from './HealthPanel'
import { Inventory } from './Inventory'
import { PhaserGame } from './PhaserGame'
import { RoomLoader } from './RoomLoader'

// The game screen (mockup section 1), below the header. The DOM order is the
// visual order, row by row, so Tab and a screen reader follow what's on
// screen:
// 1. the map, and beside it the adventure log with Actions (or the end
//    card) under it;
// 2. Health, Inventory and Goal.
//
// Actions sits beside the map, not in the bottom row (changed Nov 13): a
// fight moves focus to its first attack button, and in the bottom row a
// laptop window had to scroll to show the button, which pushed the top of
// the map out of view. Beside the map, the button is in view whenever the
// map is. It also follows the log in the reading order, so a screen reader
// user hears the fight's log lines, then the buttons. Nothing sits under
// the map, so a tall end card can't push anything down.
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
          {/* The actions slot keeps its place when there's nothing to do
              (the panel then shows an idle box), so the log doesn't change
              size. The Actions panel and the end card are never shown at
              the same time: the panel is gone when the game ends. */}
          <div className="actions-slot">
            <ActionsPanel />
            <EndCard />
          </div>
        </div>
      </div>
      <div className="below">
        <HealthPanel />
        <Inventory />
        <Goal />
      </div>
    </>
  )
}
