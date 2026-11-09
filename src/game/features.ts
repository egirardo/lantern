import type { Position } from './movement'

// A named tile in the room, like a barrel, from the tile names table
// (Phase K, step 2). Kept next to the grid, not in it: the grid only says
// 'floor' or 'wall', and features add what the log can call it ("A barrel
// blocks your path."). A room has at most one feature per cell.
export type Feature = {
  position: Position
  name: string // kebab-case, from tile-names.json, e.g. 'barrel'
}
