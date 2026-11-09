import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSaving } from './save/sync'
import { gameStore } from './state/game-store'

// Before React renders: the saved game and settings are put in the store
// first, so RoomLoader's first fetch is the saved room, not the first room,
// and the first frame already uses the player's settings. Called here, once,
// and not in a React effect, because StrictMode runs effects twice in
// development, which would start two save sessions.
startSaving(gameStore)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
