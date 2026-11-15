import { useId, type ChangeEvent } from 'react'
import { useStore } from 'zustand'
import { gameStore } from '../state/game-store'
import { settingsSchema, type Settings } from '../state/settings'

// The labels shown for each choice. The values are the store's own names
// ('normal', 'brief'…); the player sees words with a capital letter.
// `satisfies` checks that every value has a label.
const TEXT_SIZE_LABELS = {
  normal: 'Normal',
  large: 'Large',
  larger: 'Larger',
  largest: 'Largest',
} satisfies Record<Settings['textSize'], string>

const VERBOSITY_LABELS = {
  verbose: 'Verbose',
  brief: 'Brief',
} satisfies Record<Settings['logVerbosity'], string>

// The Settings pages of the book: the four settings as native controls.
// - Native <input type="checkbox"> and <select>, each with a <label>, so the
//   browser and screen reader already know how to use and announce them.
// - Every change goes to the store at once with updateSettings (no Save
//   button). The store is the one source of truth (rule 2); the save code
//   saves settings from there, and use-settings-on-root.ts and the Phaser
//   scene apply them.
// - The controls are "controlled": their value comes from the store, so they
//   always show what's really set, also after a sync loads newer settings.
export function SettingsForm() {
  const settings = useStore(gameStore, (s) => s.settings)
  const updateSettings = useStore(gameStore, (s) => s.updateSettings)
  const id = useId()

  // A <select>'s value is a plain string to TypeScript. Parsing it with the
  // schema's own enum turns it back into the exact type (and would throw on
  // a value that isn't one of the options, which would be a bug here).
  function changeTextSize(event: ChangeEvent<HTMLSelectElement>) {
    updateSettings({
      textSize: settingsSchema.shape.textSize.parse(event.target.value),
    })
  }
  function changeVerbosity(event: ChangeEvent<HTMLSelectElement>) {
    updateSettings({
      logVerbosity: settingsSchema.shape.logVerbosity.parse(event.target.value),
    })
  }

  return (
    <>
      <div className="book-page">
        <h2 className="page-banner">Settings</h2>
        {/* The label wraps the checkbox, so clicking the words ticks it too,
            and the box gets its name from them. */}
        <label className="setting setting-check">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) =>
              updateSettings({ reducedMotion: event.target.checked })
            }
          />
          Reduce motion
        </label>
        <label className="setting setting-check">
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(event) =>
              updateSettings({ highContrast: event.target.checked })
            }
          />
          High contrast
        </label>
        {/* htmlFor and id here (not a wrapping label), so the label can sit
            above the select when the text is large. */}
        <div className="setting">
          <label htmlFor={`${id}-text-size`}>Text size</label>
          <select
            id={`${id}-text-size`}
            value={settings.textSize}
            onChange={changeTextSize}
          >
            {Object.entries(TEXT_SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="setting">
          <label htmlFor={`${id}-verbosity`}>Adventure log</label>
          <select
            id={`${id}-verbosity`}
            value={settings.logVerbosity}
            onChange={changeVerbosity}
          >
            {Object.entries(VERBOSITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="book-page">
        <h3>About these settings</h3>
        <p>
          Reduce motion stops the animations. It starts on if your computer asks
          for less motion.
        </p>
        <p>High contrast turns off the decorations and uses black and white.</p>
        <p>Text size makes all the text on the page bigger.</p>
        <p>
          Brief makes the adventure log shorter, for example without the lines
          about crates and pillars. It never leaves out enemies or exits.
        </p>
        <p>
          Your settings are saved in this browser, and in your account when
          you’re signed in.
        </p>
      </div>
    </>
  )
}
