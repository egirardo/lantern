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
// 1. the map and the adventure log, side by side, the same height;
// 2. under the map: health and the exit button;
// 3. Your turn (or the end card), Inventory and Goal.
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
        <AdventureLog />
      </div>
      <div className="hud">
        <HealthDisplay />
        <ExitButton />
      </div>
      <div className="below">
        {/* The turn slot keeps its place in the row when there's no
            fight (the menu then shows an idle box), so Inventory and Goal
            never jump sideways when a fight starts or ends (see .turn-slot
            in game.css). The combat menu and the end card are never shown
            at the same time: a fight is over before the game ends. */}
        <div className="turn-slot">
          <CombatMenu />
          <EndCard />
        </div>
        <Inventory />
        <Goal />
      </div>
    </>
  )
}
