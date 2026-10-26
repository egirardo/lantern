import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { gameStore } from './state/game-store'

// TEMPORARY: lets me call gameStore.getState().movePlayer('east') in the browser console.
if (import.meta.env.DEV) {
  Object.assign(window, { gameStore })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
