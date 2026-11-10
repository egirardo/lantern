// Turns an error thrown by the auth functions (src/save/auth.ts) into a
// plain-language message for the account panel.
//
// Why not show error.message? Supabase's messages are written for developers
// ("Invalid login credentials", "Email rate limit exceeded"), they're in
// English jargon, and they can change between versions. The error *code* is
// stable, so the wording is chosen from the code here.
//
// The messages are second person, say what to do next, and never blame the
// player ("That email and password don't match" instead of "You typed the
// wrong password"). Where it helps, they remind the player that guest play
// still works, so a failed sign-in never feels like it blocks the game.
//
// This is a pure function (no React, no Supabase calls), so it's easy to unit
// test: give it an error, check the message.

// Which field a message is about, so the panel can put the message next to
// that field, mark it aria-invalid and move focus there. null means the
// message is about the whole form (e.g. a network error, or a wrong email or
// password, where we can't, and shouldn't, say which of the two is wrong).
export type AuthErrorField = 'email' | 'password' | null

export type AuthErrorInfo = {
  message: string
  field: AuthErrorField
}

// Also used by AccountPanel when it knows up front that accounts can't work
// (Supabase isn't configured), so the wording is the same in both places.
export const ACCOUNTS_UNAVAILABLE_MESSAGE =
  'Accounts are unavailable right now. You can keep playing as a guest: your progress is saved in this browser.'

// The password rule set in the Supabase dashboard (Authentication → Sign In /
// Providers → Email): at least 8 characters, with a lowercase letter, an
// uppercase letter, a number and a symbol. Shown under the password field
// when creating an account, so the player knows it before they choose one
// (WCAG 3.3.2), and repeated in the weak password message. If the setting in
// the dashboard changes, change this text too: the app can't read it.
export const PASSWORD_REQUIREMENTS =
  'At least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.'

const NETWORK_MESSAGE =
  "We can't reach the account server. Check your internet connection and try again. You can keep playing as a guest in the meantime."

const UNKNOWN_MESSAGE =
  'Something went wrong. Try again in a moment. You can keep playing as a guest in the meantime.'

// The messages for the error codes the panel can run into. The codes are the
// ones in node_modules/@supabase/auth-js/src/lib/error-codes.ts (the ErrorCode
// type). A lookup table keyed by code is easier to read and extend than a
// long if/else chain.
//
// It's turned into a Map below instead of being looked up as a plain object:
// `MESSAGES[code]` on a plain object would also find inherited properties,
// so a code like "constructor" would return a function, not a message.
const RATE_LIMIT: AuthErrorInfo = {
  message:
    'Too many tries in a short time. Wait a few minutes, then try again.',
  field: null,
}

const MESSAGES_BY_CODE = new Map<string, AuthErrorInfo>(
  Object.entries({
    // Sign in with an email that has no account, or the wrong password.
    // Supabase deliberately gives the same code for both, so nobody can find
    // out which emails have accounts. The message doesn't guess either.
    invalid_credentials: {
      message:
        "That email and password don't match an account. Check them and try again.",
      field: null,
    },
    // Sign up with an email that already has an account. Two codes exist:
    // user_already_exists (older servers) and email_exists (newer ones).
    // Note: with email confirmation on (as in this project), Supabase usually
    // does NOT send this error. It pretends the sign-up worked, for the same
    // privacy reason as above, and the player gets "check your email" instead.
    user_already_exists: {
      message:
        'There is already an account with this email. Sign in instead, using "I already have an account".',
      field: 'email',
    },
    email_exists: {
      message:
        'There is already an account with this email. Sign in instead, using "I already have an account".',
      field: 'email',
    },
    // The password doesn't meet the project's rule (see PASSWORD_REQUIREMENTS).
    weak_password: {
      message: `Choose a stronger password. ${PASSWORD_REQUIREMENTS}`,
      field: 'password',
    },
    email_address_invalid: {
      message: 'Check the email address. It should look like name@example.com.',
      field: 'email',
    },
    // Sign in before clicking the link in the confirmation email.
    email_not_confirmed: {
      message:
        'Your email address is not confirmed yet. Open the link in the email we sent you, then sign in again.',
      field: null,
    },
    // Too many requests from this browser in a short time.
    over_request_rate_limit: RATE_LIMIT,
    // Too many emails sent (sign-up sends a confirmation email). Supabase's
    // built-in email service only allows a few per hour.
    over_email_send_rate_limit: {
      message:
        "We can't send more emails right now. Wait a while (up to an hour), then try again.",
      field: null,
    },
  }),
)

// Reads a string property (`code`, `name`, `message`) from an unknown thrown value without trusting its
// type. `catch (error)` gives `unknown` in strict TypeScript, so each
// property is checked before it's used.
function readString(error: unknown, key: 'code' | 'name' | 'message') {
  if (typeof error === 'object' && error !== null && key in error) {
    const value = (error as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

function readStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const value = (error as Record<string, unknown>).status
    return typeof value === 'number' ? value : undefined
  }
  return undefined
}

export function describeAuthError(error: unknown): AuthErrorInfo {
  // supabase-client.ts throws a plain Error starting with this text when the
  // Supabase env variables are missing. It's matched on the text because it
  // isn't an AuthError and has no code.
  const message = readString(error, 'message')
  if (message?.startsWith('Supabase is not configured')) {
    return { message: ACCOUNTS_UNAVAILABLE_MESSAGE, field: null }
  }

  const code = readString(error, 'code')
  // Map.get gives undefined for a code that isn't in the table.
  const known = code ? MESSAGES_BY_CODE.get(code) : undefined
  if (known) {
    return known
  }

  // HTTP 429 means "too many requests", in case the server sends a rate
  // limit without one of the codes above.
  if (readStatus(error) === 429) {
    return RATE_LIMIT
  }

  // auth-js wraps every failed fetch (offline, DNS, server down with 5xx)
  // in an AuthRetryableFetchError, so its name means "a network problem".
  if (readString(error, 'name') === 'AuthRetryableFetchError') {
    return { message: NETWORK_MESSAGE, field: null }
  }

  return { message: UNKNOWN_MESSAGE, field: null }
}
