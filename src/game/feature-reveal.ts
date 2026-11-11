import { samePosition, type Position } from './movement'
import type { Feature } from './features'
import { directionFrom, type CompassDirection } from './compass'
import { isLit, nearestTile } from './visibility'

// Decor reveals (Phase K step 7, decided Nov 9 and Nov 10): when the lantern
// lights named decor for the first time in a room visit, the log says so,
// "A crate appears to the east." These are the pure helpers; the store only
// calls them and keeps the seen list. The words are in narration.ts
// (describeFeatureReveal), like the other reveal lines.

// One piece of decor as the player thinks of it: one pillar, one fountain,
// one crate. A pillar is two tiles and a fountain many, but each should be
// announced once, not once per tile.
export type FeaturePiece = {
  // Tells pieces apart in the store's seen list (seenPieceKeys). Built from
  // the name and the piece's first tile, e.g. 'pillar@3,0'. A room's
  // features never change during a visit, so the same piece gets the same
  // key on every step.
  key: string
  name: string
  // Every tile of the piece, in the order of the room's features (row by
  // row, top to bottom, left to right). Never empty.
  tiles: Position[]
}

// Names where every tile is its own piece, even when two touch (decided
// Nov 10). Two crates side by side are two crates, while two pillar tiles on
// top of each other are one pillar. A Set, because the question is only
// "is this name in it?".
const ONE_TILE_PER_PIECE = new Set(['crate'])

// The four straight neighbours (no diagonals): two tiles only belong to the
// same piece if they share an edge.
const NEIGHBOUR_OFFSETS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
]

// Groups a room's features into pieces: tiles that touch (4-neighbour) and
// have the same name are one piece, except for the names in
// ONE_TILE_PER_PIECE. The store calls it once per step with the room's
// features; a room has at most 120 cells, so that costs nothing.
//
// How it works (a "flood fill"): take the first feature not yet in a piece,
// start a new piece with it, then keep adding same-name neighbours of the
// piece's tiles until none are left. Repeat until every feature is in a
// piece. The order of the result follows the features, so the same room
// always gives the same pieces and keys.
export function groupFeaturePieces(features: Feature[]): FeaturePiece[] {
  const pieces: FeaturePiece[] = []
  // The features already put in a piece. A Set of the feature objects
  // themselves (reference equality), so no position-to-string keys needed.
  const used = new Set<Feature>()

  for (const start of features) {
    if (used.has(start)) continue
    used.add(start)
    const tiles: Position[] = [start.position]

    if (!ONE_TILE_PER_PIECE.has(start.name)) {
      // `tiles` grows while we loop over it, so the for loop also visits the
      // tiles added along the way. That is what spreads the fill outwards.
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        // Always defined (i < tiles.length), but noUncheckedIndexedAccess
        // can't know that.
        if (tile === undefined) continue
        for (const offset of NEIGHBOUR_OFFSETS) {
          const next = { x: tile.x + offset.x, y: tile.y + offset.y }
          const neighbour = features.find(
            (feature) =>
              !used.has(feature) &&
              feature.name === start.name &&
              samePosition(feature.position, next),
          )
          if (neighbour) {
            used.add(neighbour)
            tiles.push(neighbour.position)
          }
        }
      }
    }

    pieces.push({
      key: `${start.name}@${start.position.x},${start.position.y}`,
      name: start.name,
      // Sorted back into row order, because the fill adds tiles in the
      // order it finds them, not in the room's order.
      tiles: tiles.sort((a, b) => a.y - b.y || a.x - b.x),
    })
  }
  return pieces
}

// The pieces to announce after a step: at least one tile is lit now, and the
// piece hasn't been announced in this room visit yet (decision 2, Nov 10:
// once per visit, unlike enemies and exits, which come back every time).
// Because of the seen list, this doesn't need the lit tiles before the step:
// a piece that was already lit was already announced and is in `seenKeys`.
// filter() keeps the pieces' order and never changes the inputs.
export function getNewlyLitPieces(
  pieces: FeaturePiece[],
  litAfter: Position[],
  seenKeys: string[],
): FeaturePiece[] {
  return pieces.filter(
    (piece) =>
      !seenKeys.includes(piece.key) &&
      piece.tiles.some((tile) => isLit(litAfter, tile)),
  )
}

// What one decor line says: a name, how many pieces, and where.
export type FeatureRevealGroup = {
  name: string
  count: number
  direction: CompassDirection
}

// Groups the pieces lit in one step into lines (decision 3, Nov 10): pieces
// with the same name *and* the same direction are one line ("Crates appear
// to the east."). Same-name pieces in different directions get one line
// each, so every line can still say where its pieces are.
// - The direction points at the piece's nearest lit tile (decision 4), like
//   a two-tile door in exitRevealEntries. Every piece passed in has at least
//   one lit tile (getNewlyLitPieces), so nearestTile never gets an empty
//   list. directionFrom can't throw: named decor is always on `walls`
//   (checkFeatures in loadRoom), so the player never stands on it.
// - The groups come in the order their first piece comes in `newlyLit`.
export function groupFeatureReveals(
  newlyLit: FeaturePiece[],
  litAfter: Position[],
  from: Position,
): FeatureRevealGroup[] {
  const groups: FeatureRevealGroup[] = []
  for (const piece of newlyLit) {
    const litTiles = piece.tiles.filter((tile) => isLit(litAfter, tile))
    const direction = directionFrom(from, nearestTile(litTiles, from))
    const group = groups.find(
      (g) => g.name === piece.name && g.direction === direction,
    )
    if (group) {
      group.count += 1
    } else {
      groups.push({ name: piece.name, count: 1, direction })
    }
  }
  return groups
}
