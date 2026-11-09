import { AdventureLog } from './ui/AdventureLog'
import { CombatMenu } from './ui/CombatMenu'
import { ExitButton } from './ui/ExitButton'
import { GameOver } from './ui/GameOver'
import { Inventory } from './ui/Inventory'
import { PhaserGame } from './ui/PhaserGame'
import { RoomLoader } from './ui/RoomLoader'
import { Victory } from './ui/Victory'

function App() {
  return (
    <main>
      <h1>Lantern</h1>
      {/* No room id here: RoomLoader reads it from the store, so an exit can
          change the room. */}
      <RoomLoader />
      {/* Two columns: the map and the combat menu on the left, the log on the
          right, so the log is visible without scrolling. The DOM order stays
          map → menu → inventory → log, so the Tab order and screen reader
          order match what you see. The inventory goes after the actions and
          end messages: it has nothing to press, so the buttons stay right
          after the map, and it sits under the map, out of the way. */}
      <div className="game-layout">
        <div className="game-column">
          <PhaserGame />
          <ExitButton />
          <CombatMenu />
          <GameOver />
          <Victory />
          <Inventory />
        </div>
        <AdventureLog />
      </div>
    </main>
  )
}

export default App
