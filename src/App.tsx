import { AdventureLog } from './ui/AdventureLog'
import { CombatMenu } from './ui/CombatMenu'
import { PhaserGame } from './ui/PhaserGame'
import { RoomLoader } from './ui/RoomLoader'

function App() {
  return (
    <main>
      <h1>Lantern</h1>
      <RoomLoader roomId="entrance-hall" />
      {/* Two columns: the map and the combat menu on the left, the log on the
          right, so the log is visible without scrolling. The DOM order stays
          map → menu → log, so the Tab order and screen reader order match
          what you see. */}
      <div className="game-layout">
        <div className="game-column">
          <PhaserGame />
          <CombatMenu />
        </div>
        <AdventureLog />
      </div>
    </main>
  )
}

export default App
