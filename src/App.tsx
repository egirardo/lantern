import { useState } from 'react'
import { flushSync } from 'react-dom'
import { BookMenu } from './ui/BookMenu'
import type { BookTab } from './ui/book-tabs'
import { GameScreen } from './ui/GameScreen'
import { StartScreen } from './ui/StartScreen'
import { uiAsset } from './ui/ui-asset'
import { useSettingsOnRoot } from './ui/use-settings-on-root'

type Screen = 'start' | 'game'

function App() {
  // High contrast and text size on <html>, for every screen.
  useSettingsOnRoot()

  // Which screen shows. Every page load begins on the start screen.
  const [screen, setScreen] = useState<Screen>('start')
  // The book menu's open tab, or null while it's closed. One piece of state
  // for both "is it open" and "on which page", set by the buttons below and
  // on the start screen, and by the tabs inside the book.
  const [bookTab, setBookTab] = useState<BookTab | null>(null)

  // Start or Continue: show the game and put focus on the map, so the arrow
  // keys work at once. flushSync makes React render the game screen right
  // now, inside this click handler, so the map exists when we focus it.
  // The saved game is already in the store (startSaving runs before React,
  // in main.tsx), so Continue needs nothing else: the room loads from it.
  function start() {
    flushSync(() => setScreen('game'))
    document.getElementById('phaser-game')?.focus()
  }

  return (
    <>
      {screen === 'start' ? (
        <main className="screen screen-start">
          <StartScreen onStart={start} onOpenBook={setBookTab} />
        </main>
      ) : (
        // The game is only rendered after Start, not hidden behind the start
        // screen: then nothing in it can be reached by Tab or a screen
        // reader too early, and the room's first lines are announced when
        // the player is actually there.
        <>
          <header className="screen game-header">
            <h1>Lantern</h1>
            {/* The arrow keys only work while the map has focus, and a
                click elsewhere or the book takes it away. This says how to
                get it back, where a sighted player sees it (WCAG 3.3.2; #53
                VoiceOver pass, Nov 13). Plain text, read by screen readers
                too: after Start focus is on the map, so they only reach it
                by going back up the page. */}
            <p className="header-hint">Click the map or tab to it to play.</p>
            {/* Each button opens the book on its own page. The icons are
                decoration; the button's text is its name. */}
            <div className="header-buttons">
              <button
                type="button"
                className="btn"
                onClick={() => setBookTab('help')}
              >
                <img className="icon" src={uiAsset('icon-help.png')} alt="" />
                How to play
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setBookTab('settings')}
              >
                <img
                  className="icon"
                  src={uiAsset('icon-settings.png')}
                  alt=""
                />
                Settings
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setBookTab('account')}
              >
                <img
                  className="icon"
                  src={uiAsset('icon-account.png')}
                  alt=""
                />
                Account
              </button>
            </div>
          </header>
          <main className="screen">
            <GameScreen />
          </main>
        </>
      )}
      {/* Outside both screens, so it opens the same way from either. */}
      <BookMenu
        openTab={bookTab}
        onSelectTab={setBookTab}
        onClose={() => setBookTab(null)}
      />
    </>
  )
}

export default App
