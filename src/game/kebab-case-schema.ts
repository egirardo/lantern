import { z } from 'zod'

// Kebab-case: lowercase letters and numbers in groups joined by single
// hyphens, e.g. 'giant-rat' or 'key-1'. No leading, trailing or double
// hyphens. CLAUDE.md uses it for room ids, enemy types and item types, and
// the tile names table uses it too.
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * A Zod string schema that only accepts kebab-case. Every id schema uses
 * this, so the rule lives in one place and can't drift between them.
 *
 * It's a function, not one shared schema, so each error message can say
 * which kind of value was wrong ("Room ID must be…"). That matters most
 * for agent-built rooms, where the message is all the agent sees.
 *
 * @param label - What the value is, e.g. 'Room ID'. Starts the message.
 */
export function kebabCaseSchema(label: string) {
  return z.string().regex(KEBAB_CASE, {
    message: `${label} must be in kebab-case (lowercase letters, numbers, and hyphens)`,
  })
}
