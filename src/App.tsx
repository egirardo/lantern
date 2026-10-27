import { AdventureLog } from './ui/AdventureLog'
import { PhaserGame } from './ui/PhaserGame'
import { RoomLoader } from './ui/RoomLoader'

function App() {
  return (
    <main>
      <h1>Lantern</h1>
      <RoomLoader roomId="entrance-hall" />
      <PhaserGame />
      <AdventureLog />
    </main>
  )
}

export default App
