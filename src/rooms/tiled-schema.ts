import { z } from 'zod'

// Validates only the parts of Tiled's JSON export that the room engine uses.
// z.object (not strictObject) on purpose: extra Tiled fields (tiledversion,
// opacity, tilesets…) are stripped from the result instead of failing the
// parse. Only tile layers are allowed, so object, image and group layers,
// and infinite maps (which use `chunks` instead of `data`), are rejected.
export const tiledSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    tilewidth: z.number().int().positive(),
    tileheight: z.number().int().positive(),
    layers: z.array(
      z.object({
        type: z.literal('tilelayer'),
        name: z.string(),
        // No upper limit: flipped tiles store flags in the high bits, so
        // their IDs can be over 2 billion.
        data: z.array(z.number().int().nonnegative()),
      }),
    ),
  })
  // Runs after the field rules pass. It lives on the map, not the layer,
  // because it needs the map's width and height as well as each layer's data.
  // superRefine (not refine) so the error points at the exact layer.
  .superRefine((map, ctx) => {
    const expected = map.width * map.height
    map.layers.forEach((layer, i) => {
      if (layer.data.length !== expected) {
        ctx.addIssue({
          code: 'custom',
          message: `Layer "${layer.name}" has ${layer.data.length} tiles, expected ${expected} (width × height)`,
          path: ['layers', i, 'data'],
        })
      }
    })
  })

export type TiledMap = z.infer<typeof tiledSchema>
