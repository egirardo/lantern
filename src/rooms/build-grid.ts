import type { TiledMap } from './tiled-schema'
import type { Grid, Tile } from '../game/movement'

export function buildGrid(map: TiledMap): Grid {
  const floorLayer = map.layers.find((layer) => layer.name === 'floor')
  const wallsLayer = map.layers.find((layer) => layer.name === 'walls')

  if (!floorLayer) {
    throw new Error('Map is missing a floor layer')
  }

  const grid: Grid = []
  for (let y = 0; y < map.height; y++) {
    const row: Tile[] = []
    for (let x = 0; x < map.width; x++) {
      const index = y * map.width + x
      const floorTileId = floorLayer.data[index]
      const wallTileId = wallsLayer ? wallsLayer.data[index] : 0

      if (wallTileId !== 0) {
        row.push('wall')
      } else if (floorTileId !== 0) {
        row.push('floor')
      } else {
        // If both floor and wall are 0, treat it as wall by default
        row.push('wall')
      }
    }
    grid.push(row)
  }

  return grid
}
