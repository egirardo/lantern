import type { Room } from './room-schema'

export const floorLayer = {
  data: [258, 258, 258, 259, 260, 324, 323, 266, 258],
  height: 3,
  id: 2,
  name: 'floor',
  opacity: 1,
  type: 'tilelayer',
  visible: true,
  width: 3,
  x: 0,
  y: 0,
}

export const wallsLayer = {
  data: [66, 67, 132, 0, 0, 0, 0, 0, 0],
  height: 3,
  id: 1,
  name: 'walls',
  opacity: 1,
  type: 'tilelayer',
  visible: true,
  width: 3,
  x: 0,
  y: 0,
}

// What Tiled actually exports for an object layer: `objects` instead of `data`.
export const objectLayer = {
  draworder: 'topdown',
  id: 3,
  name: 'objects',
  objects: [],
  opacity: 1,
  type: 'objectgroup',
  visible: true,
  x: 0,
  y: 0,
}

export const validMap = {
  compressionlevel: -1,
  height: 3,
  infinite: false,
  layers: [floorLayer, wallsLayer],
  nextlayerid: 3,
  nextobjectid: 1,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.12.2',
  tileheight: 16,
  tilesets: [
    {
      columns: 64,
      firstgid: 1,
      image: '../lantern/public/assets/dungeon/dungeontileset-extended.png',
      imageheight: 1024,
      imagewidth: 1024,
      margin: 0,
      name: 'dungeon',
      spacing: 0,
      tilecount: 4096,
      tileheight: 16,
      tilewidth: 16,
    },
  ],
  tilewidth: 16,
  type: 'map',
  version: '1.10',
  width: 3,
}

export function newMap() {
  return structuredClone(validMap)
}

// A room that should pass every rule. Each failing test copies it and breaks
// exactly one thing, so we know which rule caused the failure.
// The Room annotation makes TypeScript warn us if this fixture drifts from the schema.
// Its positions fit validMap: the start and both exits are on floor tiles.
export const validRoom: Room = {
  id: 'room-1',
  name: 'Room 1',
  map: 'map-1',
  playerStart: { x: 1, y: 1 },
  description: 'A simple room.',
  exits: [
    { position: { x: 0, y: 1 }, to: 'room-2' },
    { position: { x: 2, y: 2 }, to: 'room-3' },
  ],
}
