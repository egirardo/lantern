import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import type { User } from '@supabase/supabase-js'
import { onAuthChange, signIn, signOut, signUp } from '../save/auth'
import { getSupabaseClient } from '../save/supabase-client'
import {
  ACCOUNTS_UNAVAILABLE_MESSAGE,
  PASSWORD_REQUIREMENTS,
  describeAuthError,
} from './auth-messages'

// The account panel: sign in, create an account, sign out.
//
// It's self-contained so it can be moved into a menu later without changes:
// - It makes no layout assumptions. The root is a <section> with the class
//   "account-panel", and all its styles hang off that class.
// - The caller picks the heading level (default h2), so the panel fits into
//   any heading outline. The form's own heading is one level below.
// - The login state lives inside this component, not in the Zustand store.
//   Who is signed in is not game state (rule 2 is about game state), and
//   src/save/sync.ts already listens to Supabase itself to sync saves.
//
// Guest play is the default: the game never waits for this panel, and when
// Supabase isn't configured, the panel just says accounts are unavailable.

type HeadingLevel = 2 | 3 | 4 | 5

// The form heading is one level below the panel heading.
const SUBHEADING_TAG = { 2: 'h3', 3: 'h4', 4: 'h5', 5: 'h6' } as const

type Mode = 'sign-in' | 'sign-up'

// Errors to show, by where they go: next to the email field, next to the
// password field, or for the whole form (e.g. "can't reach the server").
type FormErrors = {
  email?: string
  password?: string
  form?: string
}

// Checks before anything is sent: only that the fields aren't empty. The
// server checks the rest (email format, password strength), and its errors
// come back through describeAuthError. We use noValidate on the form and our
// own messages, because the browser's built-in bubbles disappear after a few
// seconds and aren't linked to the field for screen readers.
function checkFields(email: string, password: string, mode: Mode): FormErrors {
  const errors: FormErrors = {}
  if (email.trim() === '') {
    errors.email = 'Enter your email address.'
  }
  if (password === '') {
    errors.password =
      mode === 'sign-in' ? 'Enter your password.' : 'Choose a password.'
  }
  return errors
}

function hasErrors(errors: FormErrors) {
  return Boolean(errors.email || errors.password || errors.form)
}

// Whether Supabase is configured. getSupabaseClient throws when the env
// variables are missing (see supabase-client.ts), so we try it once.
function accountsAvailable(): boolean {
  try {
    getSupabaseClient()
    return true
  } catch {
    return false
  }
}

export function AccountPanel({
  headingLevel = 2,
  hideFormUntilChosen = false,
}: {
  headingLevel?: HeadingLevel
  // When true, a guest first sees two buttons, Sign in and Create an
  // account, and the form only appears when one is pressed. Used on the
  // start screen: with a login form on the page at load, Safari's AutoFill
  // moved focus to the email field at once (found Nov 12), so a screen
  // reader started there instead of at the top of the page. In the book's Account tab the player has already
  // asked for the form, so it's shown at once there.
  hideFormUntilChosen?: boolean
}) {
  // A function passed to useState runs only on the first render (a "lazy
  // initial state"), so the check isn't repeated on every re-render.
  const [available] = useState(accountsAvailable)

  // undefined: not known yet (waiting for Supabase's first answer).
  // null: a guest. A User: signed in.
  const [user, setUser] = useState<User | null | undefined>(undefined)

  const [mode, setMode] = useState<Mode>('sign-in')
  // Whether the guest has pressed Sign in or Create an account (only used
  // with hideFormUntilChosen).
  const [formChosen, setFormChosen] = useState(false)
  // Controlled inputs: React state holds what's typed, so an error never
  // clears the fields, and we can read the values when the form is sent.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  // The text in the live region ("Signing in…", "Signed out."…), and whether
  // it's also shown on screen. After signing in or out, the panel itself
  // already says the new state ("Signed in as …", "You're playing as a
  // guest"), so the message is only read out: shown as well, sighted players
  // saw "Signed in as" twice (found in the Nov 11 browser check). Messages the
  // rest of the panel doesn't show ("Signing in…", "Check your email") stay
  // visible.
  const [status, setStatusState] = useState({ text: '', visible: true })
  function setStatus(text: string, { visible = true } = {}) {
    setStatusState({ text, visible })
  }

  // Whether a request is on its way. Two copies, for two jobs:
  // - the state re-renders the buttons with aria-disabled;
  // - the ref is read by the handlers to ignore a second press. State would
  //   only update on the next render, so two quick presses could both see
  //   "not pending"; a ref changes at once.
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  // Elements we move focus to.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const formHeadingRef = useRef<HTMLHeadingElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const formErrorRef = useRef<HTMLParagraphElement>(null)

  // useId gives ids that are unique on the page, even if the panel is shown
  // twice. They connect labels, headings and error messages to their fields.
  const id = useId()
  const headingId = `${id}-heading`
  const emailId = `${id}-email`
  const passwordId = `${id}-password`
  const emailErrorId = `${id}-email-error`
  const passwordErrorId = `${id}-password-error`
  const passwordHintId = `${id}-password-hint`
  const formErrorId = `${id}-form-error`

  // Listen to the login state. onAuthChange calls setUser right away with
  // the current player (or null), and again on every sign in, sign out and
  // token refresh, including from another tab. It returns the unsubscribe
  // function, which is also this effect's cleanup, so the listener is
  // removed when the panel unmounts (and StrictMode's extra mount/unmount
  // in development doesn't leave two listeners).
  useEffect(() => {
    if (!available) return
    return onAuthChange(setUser)
  }, [available])

  // Shows errors and moves focus to the first one: the first invalid field,
  // or the form error when no field is to blame. flushSync makes React put
  // the error text and aria-invalid on the page *before* focus moves, so the
  // screen reader reads the field together with its error.
  function showErrors(next: FormErrors) {
    flushSync(() => setErrors(next))
    if (next.email) {
      emailRef.current?.focus()
    } else if (next.password) {
      passwordRef.current?.focus()
    } else if (next.form) {
      formErrorRef.current?.focus()
    }
  }

  // Signed in (by signing in, or by signing up without email confirmation).
  //
  // Focus goes to the panel heading. The form, and the submit button that
  // had focus, are about to disappear, and focus on a removed element drops
  // to the page body (VoiceOver then jumps to "main", as found in the combat
  // menu). The heading is on the page in every state, so it's safe to focus
  // now. Why not the Sign out button? Then a second press of Enter, or a
  // habit of pressing Space, would sign the player straight out again. From
  // the heading, the next Tab reaches Sign out anyway.
  function finishSignedIn(statusText: string) {
    setEmail('')
    // Don't keep the password in memory once it's been used. The password
    // manager has it if the player wants it again.
    setPassword('')
    setShowPassword(false)
    setMode('sign-in')
    // Back to the two buttons for the next time the player is a guest.
    setFormChosen(false)
    setStatus(statusText, { visible: false })
    headingRef.current?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Stop the browser's own form submit, which would reload the page.
    event.preventDefault()
    if (pendingRef.current) return

    const fieldErrors = checkFields(email, password, mode)
    if (hasErrors(fieldErrors)) {
      showErrors(fieldErrors)
      return
    }

    pendingRef.current = true
    setPending(true)
    setErrors({})
    setStatus(mode === 'sign-in' ? 'Signing in…' : 'Creating your account…')

    try {
      if (mode === 'sign-in') {
        await signIn(email, password)
        finishSignedIn(`Signed in as ${email}.`)
      } else {
        const result = await signUp(email, password)
        if (result.signedIn) {
          finishSignedIn(`Account created. Signed in as ${email}.`)
        } else {
          // Email confirmation is required: no session yet. Switch to the
          // sign-in form and keep what they typed, so after clicking the link
          // they can sign in right here. Focus stays on the submit button:
          // it's the same element, now labelled "Sign in", so nothing
          // disappears under the player.
          //
          // The message is true whether the account is new or not (found
          // Nov 12): for an email that already has an account, Supabase
          // sends no email and answers exactly like a new sign-up, so nobody
          // can use this form to find out which emails are registered. We
          // keep that protection and don't say "Account created".
          setMode('sign-in')
          setStatus(
            'Check your email. If this is a new account, open the confirmation link, then sign in here. If you already have an account, you can sign in now.',
          )
        }
      }
    } catch (caught) {
      setStatus('')
      // Keep the typed email and password: the player only needs to fix
      // what's wrong, not type everything again.
      const info = describeAuthError(caught)
      showErrors(
        info.field ? { [info.field]: info.message } : { form: info.message },
      )
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  async function handleSignOut() {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    setErrors({})
    setStatus('Signing out…')

    try {
      await signOut()
      setStatus('Signed out. You are playing as a guest.', { visible: false })
      // The two buttons again (with hideFormUntilChosen), so AutoFill
      // doesn't pop up on the start screen's form right after signing out.
      setFormChosen(false)
      // Same reason as after signing in: the Sign out button is about to
      // disappear, and the heading is always there. From it, the next Tab
      // reaches the email field of the sign-in form (or, on the start
      // screen, the Sign in button).
      headingRef.current?.focus()
    } catch (caught) {
      setStatus('')
      showErrors({ form: describeAuthError(caught).message })
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  function switchMode() {
    if (pendingRef.current) return
    // flushSync, so the form heading has its new text ("Create an account")
    // before it gets focus and is read out. The toggle button changes its
    // label too, and a screen reader doesn't announce a label change on the
    // focused button, so focus moves to the heading that says where you are.
    // The fields keep what was typed.
    flushSync(() => {
      setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))
      setErrors({})
      setStatus('')
    })
    formHeadingRef.current?.focus()
  }

  // Shows the form in the chosen mode (with hideFormUntilChosen). Focus
  // moves to the form's heading, as when switching modes: the button that
  // was pressed disappears, and the heading says where the player is ("Sign
  // in, heading"). flushSync puts the form on the page first, so the
  // heading exists when it gets focus.
  function chooseForm(chosen: Mode) {
    flushSync(() => {
      setMode(chosen)
      setFormChosen(true)
    })
    formHeadingRef.current?.focus()
  }

  // Lists the ids of the messages that describe a field: its own error, the
  // form error, and a hint (the password rule when creating an account).
  // undefined (no attribute) when there are none. The hint is left out while
  // the field has its own error, because the weak password error already
  // repeats the rule, and a screen reader would read it twice.
  function describedBy(
    fieldErrorId: string,
    fieldError?: string,
    hintId?: string,
  ) {
    const ids = [
      fieldError ? fieldErrorId : null,
      errors.form ? formErrorId : null,
      hintId && !fieldError ? hintId : null,
    ].filter(Boolean)
    return ids.length > 0 ? ids.join(' ') : undefined
  }

  // `as const` makes TypeScript treat this as 'h2' | 'h3' | 'h4' | 'h5'
  // instead of any string, so React knows it's a heading element. A variable
  // with a capital letter can be used as a JSX tag.
  const Heading = `h${headingLevel}` as const
  const SubHeading = SUBHEADING_TAG[headingLevel]

  // The form error, shared by the signed-in view (a failed sign out) and the
  // form. tabIndex={-1} lets showErrors focus it without adding it to the
  // Tab order. The visible "Error:" means the message doesn't rely on colour.
  const formError = errors.form ? (
    <p
      ref={formErrorRef}
      id={formErrorId}
      tabIndex={-1}
      className="account-error"
    >
      <span className="account-error-prefix">Error: </span>
      {errors.form}
    </p>
  ) : null

  function renderBody() {
    if (!available) {
      return <p>{ACCOUNTS_UNAVAILABLE_MESSAGE}</p>
    }

    if (user === undefined) {
      return <p>Checking whether you’re signed in…</p>
    }

    if (user) {
      return (
        <>
          <p>Signed in as {user.email}</p>
          <p>Your progress and settings are saved to your account.</p>
          {formError}
          <button
            type="button"
            aria-disabled={pending || undefined}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </>
      )
    }

    // The start screen, before the guest has chosen: no form fields yet,
    // so AutoFill has nothing to grab. Sign in is the main button and
    // Create an account the text link below it, like the form's own pair.
    if (hideFormUntilChosen && !formChosen) {
      return (
        <>
          <p>
            You’re playing as a guest, and your progress is saved in this
            browser. Sign in to keep it on all your devices.
          </p>
          <button type="button" onClick={() => chooseForm('sign-in')}>
            Sign in
          </button>
          <button
            type="button"
            className="account-switch"
            onClick={() => chooseForm('sign-up')}
          >
            Create an account
          </button>
        </>
      )
    }

    const isSignIn = mode === 'sign-in'

    return (
      <>
        <p>
          You’re playing as a guest, and your progress is saved in this browser.
          Sign in to keep it on all your devices.
        </p>
        <SubHeading ref={formHeadingRef} tabIndex={-1}>
          {isSignIn ? 'Sign in' : 'Create an account'}
        </SubHeading>
        {/* A real <form> with a submit button: Enter in a field sends it,
            and password managers recognise it as a login form.
            noValidate: see checkFields above. */}
        <form noValidate onSubmit={handleSubmit}>
          {formError}

          <div className="account-field">
            <label htmlFor={emailId}>Email</label>
            <input
              ref={emailRef}
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                // The player is fixing it, so the old error no longer applies.
                setErrors((current) => ({ ...current, email: undefined }))
              }}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy(emailErrorId, errors.email)}
            />
            {errors.email && (
              <p id={emailErrorId} className="account-error">
                <span className="account-error-prefix">Error: </span>
                {errors.email}
              </p>
            )}
          </div>

          <div className="account-field">
            <label htmlFor={passwordId}>Password</label>
            {/* The rule only matters when choosing a password, so it's only
                shown when creating an account (WCAG 3.3.2: say what's
                needed before the player has to guess). It sits between the
                label and the field, not under it: aria-describedby reads it
                when the field gets focus, but VoiceOver can drop a
                description when the field already has text (found in the
                Nov 11 check). Here it's also read in normal reading order,
                before the field, so it can't be missed. */}
            {!isSignIn && (
              <p id={passwordHintId} className="account-hint">
                {PASSWORD_REQUIREMENTS}
              </p>
            )}
            <div className="account-password-row">
              {/* autocomplete tells the password manager what to do:
                  current-password fills a saved one, new-password offers
                  to generate and save one. */}
              <input
                ref={passwordRef}
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setErrors((current) => ({ ...current, password: undefined }))
                }}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={describedBy(
                  passwordErrorId,
                  errors.password,
                  isSignIn ? undefined : passwordHintId,
                )}
              />
              {/* A toggle button: aria-pressed says whether it's on, so the
                  label stays the same ("Show password, toggle button,
                  selected"). type="button" so it doesn't send the form. */}
              <button
                type="button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                Show password
              </button>
            </div>
            {errors.password && (
              <p id={passwordErrorId} className="account-error">
                <span className="account-error-prefix">Error: </span>
                {errors.password}
              </p>
            )}
          </div>

          {/* aria-disabled instead of disabled while a request is pending:
              a disabled button can't keep focus, so focus would drop to the
              page body. handleSubmit ignores presses while pending. */}
          <button type="submit" aria-disabled={pending || undefined}>
            {isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="account-switch"
          aria-disabled={pending || undefined}
          onClick={switchMode}
        >
          {isSignIn ? 'Create an account' : 'I already have an account'}
        </button>
      </>
    )
  }

  return (
    <section aria-labelledby={headingId} className="account-panel">
      {/* tabIndex={-1}: focusable from code (after sign in and sign out),
          but not a stop in the Tab order. */}
      <Heading id={headingId} ref={headingRef} tabIndex={-1}>
        Account
      </Heading>
      {renderBody()}
      {/* The live region is always on the page, even when empty: a screen
          reader only announces changes to a region that already existed.
          role="status" is a polite live region, so it waits for a pause
          instead of interrupting (nothing here is urgent). */}
      {/* visually-hidden (index.css) hides it from view but not from
          screen readers, so it's still announced. The region itself stays
          on the page either way. */}
      <p
        role="status"
        className={
          status.visible ? 'account-status' : 'account-status visually-hidden'
        }
      >
        {status.text}
      </p>
    </section>
  )
}
