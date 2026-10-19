import { type Direction, type MoveResult, type BlockedReason } from './movement'

// Record requires an entry for every BlockedReason, so adding a new reason
// without a corresponding message is a type error instead of a silent default.
const BLOCKED_TEXT: Record<BlockedReason, string> = {
  wall: 'A wall blocks your path',
  edge: 'The edge of the world blocks your path',
}

export function describeMove(result: MoveResult, direction: Direction): string {
  if (result.moved) {
    return `You have taken a step to the ${direction}.`
  } else {
    return `You cannot move to the ${direction}. ${BLOCKED_TEXT[result.reason]}.`
  }
}
