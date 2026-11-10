import { describe, it, expect } from 'vitest'
import {
  getNewlyLitPieces,
  groupFeaturePieces,
  groupFeatureReveals,
  type FeaturePiece,
} from './feature-reveal'
import type { Feature } from './features'
import type { Position } from './movement'

// A feature at (x, y), so the tests read like a small map.
function feature(name: string, x: number, y: number): Feature {
  return { position: { x, y }, name }
}

function piece(name: string, tiles: Position[]): FeaturePiece {
  const [first] = tiles
  if (first === undefined) throw new Error('A piece needs a tile')
  return { key: `${name}@${first.x},${first.y}`, name, tiles }
}

describe('groupFeaturePieces', () => {
  it('gives no pieces for a room with no features', () => {
    expect(groupFeaturePieces([])).toEqual([])
  })

  it('makes one piece of a pillar, two tiles on top of each other', () => {
    const pieces = groupFeaturePieces([
      feature('pillar', 3, 0),
      feature('pillar', 3, 1),
    ])
    expect(pieces).toEqual([
      {
        key: 'pillar@3,0',
        name: 'pillar',
        tiles: [
          { x: 3, y: 0 },
          { x: 3, y: 1 },
        ],
      },
    ])
  })

  it('makes one piece of a fountain spread over many tiles', () => {
    // A 3×3 fountain, given row by row like buildFeatures does.
    const fountain: Feature[] = []
    for (let y = 0; y < 3; y++) {
      for (let x = 4; x < 7; x++) fountain.push(feature('fountain', x, y))
    }
    const pieces = groupFeaturePieces(fountain)
    expect(pieces).toHaveLength(1)
    expect(pieces[0]?.tiles).toHaveLength(9)
    expect(pieces[0]?.key).toBe('fountain@4,0')
  })

  it('follows a bent shape, not only straight lines', () => {
    // An L: (0,0), (0,1), (1,1). The fill must reach (1,1) through (0,1).
    const pieces = groupFeaturePieces([
      feature('fountain', 0, 0),
      feature('fountain', 0, 1),
      feature('fountain', 1, 1),
    ])
    expect(pieces).toHaveLength(1)
    expect(pieces[0]?.tiles).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ])
  })

  it('makes every crate its own piece, even side by side', () => {
    const pieces = groupFeaturePieces([
      feature('crate', 2, 4),
      feature('crate', 3, 4),
    ])
    expect(pieces).toEqual([
      piece('crate', [{ x: 2, y: 4 }]),
      piece('crate', [{ x: 3, y: 4 }]),
    ])
  })

  it('keeps two pillars apart when they do not touch', () => {
    const pieces = groupFeaturePieces([
      feature('pillar', 1, 0),
      feature('pillar', 4, 0),
      feature('pillar', 1, 1),
      feature('pillar', 4, 1),
    ])
    expect(pieces.map((p) => p.key)).toEqual(['pillar@1,0', 'pillar@4,0'])
  })

  it('does not join tiles that only touch at a corner', () => {
    const pieces = groupFeaturePieces([
      feature('fountain', 0, 0),
      feature('fountain', 1, 1),
    ])
    expect(pieces).toHaveLength(2)
  })

  it('does not join touching tiles with different names', () => {
    const pieces = groupFeaturePieces([
      feature('pillar', 0, 0),
      feature('candlestick', 1, 0),
    ])
    expect(pieces.map((p) => p.name)).toEqual(['pillar', 'candlestick'])
  })
})

describe('getNewlyLitPieces', () => {
  const pillar = piece('pillar', [
    { x: 3, y: 0 },
    { x: 3, y: 1 },
  ])
  const crate = piece('crate', [{ x: 8, y: 8 }])

  it('returns a piece when one of its tiles is lit and it has not been seen', () => {
    // Only the pillar's lower tile is lit: that is enough.
    expect(getNewlyLitPieces([pillar, crate], [{ x: 3, y: 1 }], [])).toEqual([
      pillar,
    ])
  })

  it('leaves out a piece with no lit tile', () => {
    expect(getNewlyLitPieces([crate], [{ x: 3, y: 1 }], [])).toEqual([])
  })

  it('leaves out a piece that has already been seen in this visit', () => {
    expect(
      getNewlyLitPieces([pillar], [{ x: 3, y: 1 }], ['pillar@3,0']),
    ).toEqual([])
  })
})

describe('groupFeatureReveals', () => {
  it('gives one group for one piece, pointing at it', () => {
    const crate = piece('crate', [{ x: 7, y: 5 }])
    expect(
      groupFeatureReveals([crate], [{ x: 7, y: 5 }], { x: 5, y: 5 }),
    ).toEqual([{ name: 'crate', count: 1, direction: 'east' }])
  })

  it('counts same-name pieces in the same direction as one group', () => {
    const crates = [
      piece('crate', [{ x: 7, y: 5 }]),
      piece('crate', [{ x: 7, y: 4 }]),
    ]
    const lit = [
      { x: 7, y: 5 },
      { x: 7, y: 4 },
    ]
    // (7, 4) from (5, 5) is 2 east and 1 north: still "east".
    expect(groupFeatureReveals(crates, lit, { x: 5, y: 5 })).toEqual([
      { name: 'crate', count: 2, direction: 'east' },
    ])
  })

  it('gives one group per direction for same-name pieces in different directions', () => {
    const crates = [
      piece('crate', [{ x: 7, y: 5 }]),
      piece('crate', [{ x: 3, y: 5 }]),
    ]
    const lit = [
      { x: 7, y: 5 },
      { x: 3, y: 5 },
    ]
    expect(groupFeatureReveals(crates, lit, { x: 5, y: 5 })).toEqual([
      { name: 'crate', count: 1, direction: 'east' },
      { name: 'crate', count: 1, direction: 'west' },
    ])
  })

  it('keeps different names apart in the same direction', () => {
    const pieces = [
      piece('crate', [{ x: 7, y: 5 }]),
      piece('candlestick', [{ x: 6, y: 5 }]),
    ]
    const lit = [
      { x: 7, y: 5 },
      { x: 6, y: 5 },
    ]
    expect(groupFeatureReveals(pieces, lit, { x: 5, y: 5 })).toEqual([
      { name: 'crate', count: 1, direction: 'east' },
      { name: 'candlestick', count: 1, direction: 'east' },
    ])
  })

  it('points at the nearest lit tile of a piece, not at a tile in the dark', () => {
    // A fountain from (6, 2) to (8, 2), with only (6, 2) in the lit list.
    // From (9, 3), the nearest tile overall is (8, 2), which would be
    // north-west. It's dark, so the line must point at (6, 2) instead:
    // 3 west and 1 north is "west".
    const fountain = piece('fountain', [
      { x: 6, y: 2 },
      { x: 7, y: 2 },
      { x: 8, y: 2 },
    ])
    expect(
      groupFeatureReveals([fountain], [{ x: 6, y: 2 }], { x: 9, y: 3 }),
    ).toEqual([{ name: 'fountain', count: 1, direction: 'west' }])
  })
})
