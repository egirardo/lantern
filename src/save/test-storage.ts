import type { KeyValueStorage } from './local-store'

// A stand-in for localStorage in the tests, which run in Node, where there
// is none. A Map holds the values; `values` is returned too, so a test can
// look inside or put broken text in.
export function fakeStorage(): KeyValueStorage & {
  values: Map<string, string>
} {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}
