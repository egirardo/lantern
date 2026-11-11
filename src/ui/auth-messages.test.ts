import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthUnknownError,
  AuthWeakPasswordError,
} from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import {
  ACCOUNTS_UNAVAILABLE_MESSAGE,
  PASSWORD_REQUIREMENTS,
  describeAuthError,
} from './auth-messages'

// The errors are built with Supabase's own error classes, the same ones
// auth.ts throws, so the tests check the real shape (code, name, status)
// instead of a hand-made object that might not match.

describe('describeAuthError', () => {
  it('says the email and password do not match, without saying which', () => {
    const error = new AuthApiError(
      'Invalid login credentials',
      400,
      'invalid_credentials',
    )
    const info = describeAuthError(error)
    expect(info.message).toBe(
      "That email and password don't match an account. Check them and try again.",
    )
    // Neither field is marked: we don't know which one is wrong.
    expect(info.field).toBeNull()
  })

  it('tells the player to sign in when the account already exists', () => {
    for (const code of ['user_already_exists', 'email_exists']) {
      const info = describeAuthError(
        new AuthApiError('User already registered', 422, code),
      )
      expect(info.message).toContain('There is already an account')
      expect(info.field).toBe('email')
    }
  })

  it('asks for a stronger password and points at the password field', () => {
    const error = new AuthWeakPasswordError(
      'Password should contain at least one character of each: abc…, ABC…, 123…, !@#…',
      422,
      ['characters'],
    )
    const info = describeAuthError(error)
    expect(info.message).toContain('Choose a stronger password')
    // The same rule as the hint under the field, so the player reads one
    // rule in both places.
    expect(info.message).toContain(PASSWORD_REQUIREMENTS)
    expect(info.field).toBe('password')
  })

  it('points at the email field when the address is invalid', () => {
    const info = describeAuthError(
      new AuthApiError(
        'Email address is invalid',
        400,
        'email_address_invalid',
      ),
    )
    expect(info.field).toBe('email')
  })

  it('asks the player to confirm their email first', () => {
    const info = describeAuthError(
      new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'),
    )
    expect(info.message).toContain('not confirmed yet')
    expect(info.field).toBeNull()
  })

  it('asks the player to wait when there are too many tries', () => {
    const byCode = describeAuthError(
      new AuthApiError(
        'Request rate limit reached',
        429,
        'over_request_rate_limit',
      ),
    )
    expect(byCode.message).toContain('Too many tries')

    // A 429 without a known code is still a rate limit.
    const byStatus = describeAuthError(
      new AuthApiError('Too many requests', 429, undefined),
    )
    expect(byStatus.message).toBe(byCode.message)
  })

  it('has its own message when no more emails can be sent', () => {
    const info = describeAuthError(
      new AuthApiError(
        'Email rate limit exceeded',
        429,
        'over_email_send_rate_limit',
      ),
    )
    expect(info.message).toContain("can't send more emails")
  })

  it('blames the connection, not the player, for a network error', () => {
    // auth-js throws this with status 0 when fetch itself fails (offline).
    const info = describeAuthError(
      new AuthRetryableFetchError('Failed to fetch', 0),
    )
    expect(info.message).toContain("can't reach the account server")
    expect(info.message).toContain('guest')
    expect(info.field).toBeNull()
  })

  it('says accounts are unavailable when Supabase is not configured', () => {
    // The same text supabase-client.ts throws when the env variables are
    // missing.
    const error = new Error(
      'Supabase is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env.local (see .env.example).',
    )
    expect(describeAuthError(error)).toEqual({
      message: ACCOUNTS_UNAVAILABLE_MESSAGE,
      field: null,
    })
  })

  it('falls back to a general message for anything else', () => {
    const unknownCode = describeAuthError(
      new AuthApiError('Something new', 400, 'some_future_code'),
    )
    const unknownError = describeAuthError(
      new AuthUnknownError('Bad JSON', new SyntaxError()),
    )
    const notAnError = describeAuthError('just a string')
    const nothing = describeAuthError(undefined)

    for (const info of [unknownCode, unknownError, notAnError, nothing]) {
      expect(info.message).toContain('Something went wrong')
      expect(info.field).toBeNull()
    }
  })

  it('does not treat inherited object properties as error codes', () => {
    // A plain-object lookup would find "constructor" on every object and
    // return a function instead of a message (see the Map in auth-messages).
    const info = describeAuthError({ code: 'constructor' })
    expect(info.message).toContain('Something went wrong')
  })

  it('never shows Supabase’s own developer message', () => {
    const info = describeAuthError(
      new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
    )
    expect(info.message).not.toContain('Invalid login credentials')
  })
})
