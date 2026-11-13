import Phaser from 'phaser'
import {
  TEXTURES,
  TILESETS,
  SPRITES,
  type SpriteName,
} from '../assets/manifest'
import type { TiledMap } from '../rooms/tiled-schema'
import { toTileIndices } from '../rooms/tile-indices'
import { gameStore, type GameState } from '../state/game-store'
import type { Position } from '../game/movement'
import type { StoreEnemy } from '../game/spawn-enemies'
import type { StoreItem } from '../game/items'
import { getVisibleTiles, isLit, LANTERN_RADIUS } from '../game/visibility'
import { prefersReducedMotion } from './reduced-motion'
import { litOffsets } from './lantern-shape'
import { hitEnemies, wasHit } from './hits'
import {
  animationKey,
  enemyAnimationName,
  facingAfterStep,
  isSingleStep,
  type Facing,
} from './sprite-motion'

// Depth decides what is drawn on top: a higher depth covers a lower one. The
// tilemap layers keep the default depth 0. The dark goes over the tiles, and
// items, enemies and the player go over the dark. Items lie on the floor, so
// they go below the characters: a 16×32 character on the tile below reaches
// up over the item's tile, and should cover the item, not the other way
// round. Without depths, the order would depend on what happened to be
// created last, which changes as the game runs (enemy and item sprites come
// and go as the light moves).
const DARKNESS_DEPTH = 1
const ITEM_DEPTH = 2
const ENEMY_DEPTH = 3
const PLAYER_DEPTH = 4

// How long the player's sprite takes to slide one tile, in milliseconds.
// Short enough that walking feels quick, long enough to see the step. The
// game never waits for it: the store has already moved the player.
const WALK_DURATION = 150

// The hit flash: a red tint for a short moment on the sprite that was hit.
// setTint multiplies the sprite's colours by this colour, so the picture
// stays visible and just turns reddish (setTintFill would paint it solid red).
// It flashes once per hit and never blinks on and off, so it stays far from
// the flashing limits in WCAG 2.3.1.
const HIT_TINT = 0xff5555
const HIT_FLASH_DURATION = 150

// The name the dark image is stored under in Phaser's texture manager.
const DARKNESS_TEXTURE = 'lantern-darkness'

// Where the soft edge of the light starts and ends, in tiles from the centre
// of the player's tile. The picture must agree with the rule in
// getVisibleTiles (a tile is lit when its centre is within LANTERN_RADIUS):
// - Fully clear up to half a tile inside the radius. Lit tiles straight out
//   (2 tiles away) are fully clear in the middle, and the lit tiles at
//   (±2, ±1), about 2.24 tiles away, are only about a quarter dark there.
// - Fully black from half a tile outside the radius, so unlit tiles are
//   mostly or fully dark (the (±2, ±2) corners, about 2.83 away, are about
//   83% dark in the middle; tiles 3 or more away are solid black).
// - In between it fades, so the edge looks like lantern light, not squares.
// Enemies and items don't use the picture at all: they are shown only when
// isLit says their tile is lit, so a half-dark edge tile can never hide or
// show one wrongly.
const LIGHT_CLEAR_RADIUS = LANTERN_RADIUS - 0.5
const LIGHT_DARK_RADIUS = LANTERN_RADIUS + 0.5

// Enemy and item types are plain strings in the store, but SPRITES only has
// keys for the sprites in the manifest. This type guard checks at runtime
// that the name exists, and tells TypeScript that `name` is a SpriteName
// after the check.
// Object.hasOwn instead of `name in SPRITES`, because `in` also finds names
// every object inherits, like 'toString'.
function isSpriteName(name: string): name is SpriteName {
  return Object.hasOwn(SPRITES, name)
}

export class RoomScene extends Phaser.Scene {
  // The tilemap of the room on screen. Kept so it can be destroyed (with all
  // its layers) when the player goes through an exit to another room.
  private map?: Phaser.Tilemaps.Tilemap
  private playerSprite?: Phaser.GameObjects.Sprite
  // One big black image with a hole in the middle: soft and round, or with
  // a hard tile edge in high contrast. It is made when the room is drawn and
  // moved so the hole is always over the player.
  private darkness?: Phaser.GameObjects.Image
  // The canvas texture the darkness Image shows. Kept so paintDarkness can
  // paint it again when high contrast is turned on or off.
  private darknessTexture?: Phaser.Textures.CanvasTexture
  // The enemy sprites currently on screen: only the lit enemies, by enemy id.
  // They are Phaser objects, not game state: where the enemies are and who is
  // alive is always read from the store. A Map (not a list) so drawEnemies can
  // find the sprite an enemy already has and keep it, see drawEnemies.
  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>()
  // The item sprites currently on screen: only the lit items, by item id. The
  // same idea as enemySprites: the store says which items still lie in the
  // room, and a picked-up item's sprite is removed on the next redraw.
  private itemSprites = new Map<string, Phaser.GameObjects.Sprite>()
  private readonly PLAYER_SPRITE = 'hero-girl'
  // Which way the player's sprite looks. Kept between steps, because a step
  // north or south keeps the facing of the last step east or west.
  private playerFacing: Facing = 'right'
  // The timer of each sprite's hit flash that hasn't cleared yet. Kept so a
  // second hit can restart the timer instead of starting a second one, and so
  // a sprite's timer can be cancelled when the sprite is destroyed.
  private hitTimers = new Map<
    Phaser.GameObjects.Sprite,
    Phaser.Time.TimerEvent
  >()
  // Width and height of one tile in pixels. Set in drawRoom from the map, so
  // drawPlayer and the move code share one value instead of passing it around.
  // It stays 0 until a room is drawn, and drawRoom always runs before drawPlayer.
  private tileSize = 0

  constructor() {
    super({ key: 'room' })
  }

  preload() {
    for (const [name, texture] of Object.entries(TEXTURES)) {
      this.load.atlas(name, texture.image, texture.atlas)
    }
  }

  create() {
    // Turn the frame lists in the manifest into Phaser animations, before any
    // sprite needs one.
    this.createAnimations()

    // The room may already be in the store (if it loaded before the scene started)
    const state = gameStore.getState()
    if (state.tiledMap) {
      this.drawRoom(state.tiledMap)
      if (state.playerPosition) {
        this.drawPlayer(state.playerPosition)
      }
      this.drawLight(state)
    }

    const unsubscribe = gameStore.subscribe((state, previousState) => {
      // 1. A room has just loaded (the first one, or the next one after an
      // exit): throw away everything from the old room, then draw the new
      // room and the player on top.
      if (state.tiledMap !== previousState.tiledMap && state.tiledMap) {
        this.clearRoom()
        this.drawRoom(state.tiledMap)
        if (state.playerPosition) {
          this.drawPlayer(state.playerPosition)
        }
      }

      // 2. The player has moved: move the existing sprite. This is a separate
      // check (not nested in the one above) because tiledMap only changes when
      // a room loads, but playerPosition changes on every step.
      if (
        state.playerPosition !== previousState.playerPosition &&
        state.playerPosition
      ) {
        // After a room change the old position belongs to the old room, and
        // drawPlayer has already put the sprite on the new tile. Passing null
        // as `from` means "no step to slide, just stand there".
        const sameRoom = state.tiledMap === previousState.tiledMap
        this.movePlayerSprite(
          sameRoom ? previousState.playerPosition : null,
          state.playerPosition,
        )
      }

      // 3. The light: redraw the dark, the items and the enemies when the room
      // loads, the player moves (the light moves with them), the enemies
      // change (one was defeated and removed from the store, so its sprite
      // must go too), or the items change (one was picked up).
      if (
        state.tiledMap !== previousState.tiledMap ||
        state.playerPosition !== previousState.playerPosition ||
        state.enemies !== previousState.enemies ||
        state.items !== previousState.items
      ) {
        this.drawLight(state)
      }

      // 4. Hits: flash the sprites whose health just went down. This comes
      // after the light, so a sprite that came into the light this update
      // already exists. The combat code has already decided who was hit;
      // this only reads the change in health from the store (rule 3).
      if (
        wasHit(previousState.player.currentHealth, state.player.currentHealth)
      ) {
        if (this.playerSprite) {
          this.flashHit(this.playerSprite, this.PLAYER_SPRITE)
        }
      }
      if (state.enemies !== previousState.enemies) {
        for (const enemy of hitEnemies(previousState.enemies, state.enemies)) {
          // An enemy outside the light has no sprite, so nothing to flash.
          const sprite = this.enemySprites.get(enemy.id)
          // drawEnemies has already checked the type, so isSpriteName is
          // only here to tell TypeScript that it's a SpriteName.
          if (sprite && isSpriteName(enemy.type)) {
            this.flashHit(sprite, enemy.type)
          }
        }
      }

      // 5. High contrast was turned on or off: paint the dark again, hard or
      // soft. Only the picture on the texture changes; the Image showing it
      // stays where it is, so the hole is still over the player.
      if (state.settings.highContrast !== previousState.settings.highContrast) {
        this.paintDarkness(state.settings.highContrast)
      }

      // 6. Reduced motion was turned on or off in the settings: stop or start
      // the idle loops now. Without this, the sprites on screen would only
      // notice on the next step (the player's walk, an enemy redraw), and a
      // player who just asked for stillness would still see bobbing sprites.
      if (
        state.settings.reducedMotion !== previousState.settings.reducedMotion
      ) {
        this.applyMotionSetting(state)
      }
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe)
    this.events.once(Phaser.Scenes.Events.DESTROY, unsubscribe)
  }

  // Removes everything the old room put in the scene, before the next room is
  // drawn. Without this, the new tiles would be drawn on top of the old ones,
  // and the old player sprite would stay behind where the player used to be.
  // destroy() removes a game object from the scene and frees it. `?.` skips
  // what doesn't exist yet (on the first room there's nothing to clear).
  private clearRoom() {
    // Destroying the tilemap also destroys all of its layers.
    this.map?.destroy()
    this.map = undefined
    if (this.playerSprite) {
      // A walk may still be sliding the old sprite. Stop it first, so no
      // tween is left behind moving a destroyed sprite (and the destroyed dark
      // in its onUpdate).
      this.tweens.killTweensOf(this.playerSprite)
      this.destroySprite(this.playerSprite)
    }
    this.playerSprite = undefined
    for (const sprite of this.enemySprites.values()) {
      this.destroySprite(sprite)
    }
    this.enemySprites.clear()
    // Item sprites have no hit flash, so destroy() is enough.
    for (const sprite of this.itemSprites.values()) {
      sprite.destroy()
    }
    this.itemSprites.clear()
    // The dark's texture is removed in createDarkness, which runs next.
    this.darkness?.destroy()
    this.darkness = undefined
  }

  // Makes one Phaser animation per animation in the asset manifest, e.g.
  // 'hero-girl-idle' and 'skeleton-run'. An animation is a list of atlas
  // frames plus a speed; any sprite can then play it by key. The frames come
  // from the manifest (rule 7), so new art only means changing the manifest.
  private createAnimations() {
    for (const [spriteName, art] of Object.entries(SPRITES)) {
      for (const [animationName, animation] of Object.entries(art.animations)) {
        const key = animationKey(spriteName, animationName)
        // The animation manager belongs to the whole game, not to this scene,
        // so animations made earlier are still there if the scene is started
        // again. Phaser warns about a key that already exists, so skip it.
        if (this.anims.exists(key)) continue

        this.anims.create({
          key,
          // generateFrameNames builds the atlas frame names from the prefix
          // and the frame numbers: 'skeleton-' + [0, 1, 2, 3] ->
          // 'skeleton-0' … 'skeleton-3'. The spread makes a normal array from
          // the manifest's read-only one, which is the type Phaser asks for.
          frames: this.anims.generateFrameNames(art.texture, {
            prefix: art.framePrefix,
            frames: [...animation.frames],
          }),
          frameRate: animation.frameRate,
          repeat: animation.repeat,
        })
      }
    }
  }

  // Starts a sprite's idle loop, or shows a still frame if the player prefers
  // reduced motion. Called whenever a sprite should stand still: when it is
  // made, after the player's walk, on every redraw of the enemies, and when
  // the reduced motion setting changes (applyMotionSetting).
  // `animationName` is 'idle' for everyone except an unmasked mimic, which
  // stands with its 'unmasked' loop instead (see enemyAnimationName).
  private playIdle(
    sprite: Phaser.GameObjects.Sprite,
    spriteName: SpriteName,
    animationName: 'idle' | 'unmasked' = 'idle',
  ) {
    if (prefersReducedMotion()) {
      // stop() halts any animation but leaves whatever frame it was on, so
      // set the first frame of the animation by hand: the same still picture
      // as before there were animations. For the unmasked mimic, that's an
      // open mouth, so the change is still visible without motion.
      sprite.stop()
      const art = SPRITES[spriteName]
      // Not every sprite has an 'unmasked' animation, so TypeScript won't let
      // us index art.animations with it directly. Seen as a plain Record, the
      // lookup is allowed and may give undefined, which falls back to idle.
      const animations: Record<string, { frames: readonly number[] }> =
        art.animations
      const animation = animations[animationName] ?? art.animations.idle
      sprite.setFrame(`${art.framePrefix}${animation.frames[0]}`)
      return
    }
    // The second argument, ignoreIfPlaying, is what keeps the loop smooth:
    // if the sprite is already playing this animation, play() does nothing,
    // instead of starting again from the first frame. A different animation
    // (the mimic going from idle to unmasked) does start.
    // randomFrame starts a new idle loop on a random frame, so enemies that
    // appear together don't bob in step like a choir.
    sprite.play(
      { key: animationKey(spriteName, animationName), randomFrame: true },
      true,
    )
  }

  // Plays idle again on the player and every enemy sprite, so playIdle can
  // pick the loop or the still frame from the new setting. A walk or a hit
  // flash already running is left to finish: both go back to idle by
  // themselves when they end (the tween's onComplete, the flash timer), and
  // by then playIdle reads the new setting.
  private applyMotionSetting(state: GameState) {
    const player = this.playerSprite
    if (
      player &&
      !this.tweens.isTweening(player) &&
      !this.hitTimers.has(player)
    ) {
      this.playIdle(player, this.PLAYER_SPRITE)
    }
    // drawEnemies already calls playIdle on every lit enemy, with the right
    // loop for each one (idle, or 'unmasked' for an unmasked mimic), and keeps
    // the sprites it already has. So it is reused here instead of repeating
    // that choice. Enemies only get the red tint when hit, never a hit frame,
    // so playIdle can't cut a flash short.
    const { grid, playerPosition, enemies } = state
    if (grid === null || playerPosition === null) return
    const visibleTiles = getVisibleTiles(grid, playerPosition, LANTERN_RADIUS)
    this.drawEnemies(enemies, visibleTiles)
  }

  private drawRoom(tiledMap: TiledMap) {
    this.tileSize = tiledMap.tilewidth

    // 1. An empty map with the right size
    const map = this.make.tilemap({
      width: tiledMap.width,
      height: tiledMap.height,
      tileWidth: tiledMap.tilewidth,
      tileHeight: tiledMap.tileheight,
    })
    // Kept so clearRoom can destroy it when the next room loads.
    this.map = map

    // 2. The Tiled tileset info (name + firstgid)
    const tiledTileset = tiledMap.tilesets[0]
    if (!tiledTileset) {
      throw new Error('No tileset found in Tiled map')
    }

    // 3. A Phaser tileset made from that texture
    const phaserTileset = map.addTilesetImage(
      tiledTileset.name,
      TILESETS[tiledTileset.name].texture,
    )
    if (!phaserTileset) {
      throw new Error(
        `Failed to create Phaser tileset for ${tiledTileset.name}`,
      )
    }

    // 4. One Phaser layer per Tiled layer, filled with tiles
    for (const tiledLayer of tiledMap.layers) {
      // a) make an empty Phaser layer
      const phaserLayer = map.createBlankLayer(tiledLayer.name, phaserTileset)
      if (!phaserLayer) {
        throw new Error(`Failed to create Phaser layer for ${tiledLayer.name}`)
      }
      // b) fill it with tiles
      const tileIndices = toTileIndices(
        tiledLayer.data,
        tiledMap.width,
        tiledTileset.firstgid,
      )
      phaserLayer.putTilesAt(tileIndices, 0, 0)
    }

    // 5. The dark over the tiles. Its size depends on the map, so it's made here.
    this.createDarkness(
      tiledMap.width * tiledMap.tilewidth,
      tiledMap.height * tiledMap.tileheight,
    )
  }

  // Makes the dark: a texture painted with the browser's canvas drawing API,
  // and one Image that shows it. A texture is the picture itself (stored once in
  // the texture manager); an Image is a game object that shows a texture at a
  // position. drawLight only moves the Image, so the picture is painted once
  // per room (paintDarkness), and again only when high contrast changes.
  private createDarkness(mapWidth: number, mapHeight: number) {
    // Twice the map's size in both directions. The hole is in the middle, so
    // even with the player in a corner, the image still reaches past the
    // opposite corner and covers the whole map.
    const width = mapWidth * 2
    const height = mapHeight * 2

    // If a room was drawn before, throw away its dark. Texture keys must be
    // unique, so createCanvas returns null if the key is still in use. Making
    // it again (instead of reusing it) is simplest, because a new room can
    // have a different size. The Image goes first, since it uses the texture.
    this.darkness?.destroy()
    if (this.textures.exists(DARKNESS_TEXTURE)) {
      this.textures.remove(DARKNESS_TEXTURE)
    }

    // A canvas texture is a blank <canvas> that Phaser uses as a texture. We
    // paint on it with the normal CanvasRenderingContext2D, like on any canvas.
    const texture = this.textures.createCanvas(DARKNESS_TEXTURE, width, height)
    if (!texture) {
      throw new Error('Failed to create the darkness texture')
    }
    this.darknessTexture = texture
    this.paintDarkness(gameStore.getState().settings.highContrast)

    // An Image's origin is its centre by default, so placing it at a point
    // puts the middle of the hole exactly on that point.
    this.darkness = this.add.image(0, 0, DARKNESS_TEXTURE)
    this.darkness.setDepth(DARKNESS_DEPTH)
  }

  // Paints the dark on its canvas texture: the soft lantern light, or, with
  // high contrast, a hard edge where every lit tile is fully clear and every
  // other tile fully black (decided Nov 4), so lit and dark tiles can be told
  // apart at a glance. Called when the texture is made and again whenever
  // the high contrast setting changes.
  private paintDarkness(highContrast: boolean) {
    const texture = this.darknessTexture
    if (!texture) return
    const context = texture.getContext()
    const { width, height } = texture
    // The middle of the texture, where the middle of the player's tile goes.
    const centerX = width / 2
    const centerY = height / 2

    // Start from an empty canvas. Painting is layered like real paint, so
    // without this the new picture would be painted over the old one.
    context.clearRect(0, 0, width, height)

    if (highContrast) {
      // Solid black everywhere, then one see-through square cut out for each
      // lit tile. clearRect makes pixels fully transparent, with no fade.
      // The squares come from litOffsets, which asks getVisibleTiles, so the
      // picture follows the game's rule exactly instead of a circle that
      // would cut through the edge tiles.
      context.fillStyle = 'rgb(0, 0, 0)'
      context.fillRect(0, 0, width, height)
      for (const offset of litOffsets(LANTERN_RADIUS)) {
        // A tile reaches half a tile to each side of its middle.
        const left = centerX + (offset.x - 0.5) * this.tileSize
        const top = centerY + (offset.y - 0.5) * this.tileSize
        context.clearRect(left, top, this.tileSize, this.tileSize)
      }
    } else {
      // A radial gradient blends colours outwards from a centre point. It
      // goes from a circle of radius 0 to one of radius LIGHT_DARK_RADIUS,
      // both at the middle of the texture. The colour stops are fractions of
      // that distance (0 = centre, 1 = the outer circle). Past the outer
      // circle the last colour, solid black, carries on to the edges.
      const darkRadius = LIGHT_DARK_RADIUS * this.tileSize
      const gradient = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        darkRadius,
      )
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)') // see-through
      gradient.addColorStop(
        LIGHT_CLEAR_RADIUS / LIGHT_DARK_RADIUS,
        'rgba(0, 0, 0, 0)', // still see-through: the fade starts here
      )
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)') // solid black
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
    }

    // Painting on the canvas doesn't reach the screen by itself. refresh()
    // sends the new pixels to the GPU (WebGL), so Phaser can draw them.
    texture.refresh()
  }

  private drawPlayer(position: Position) {
    const hero = SPRITES[this.PLAYER_SPRITE]
    const { x, y } = this.tileToSpritePosition(position)
    const sprite = this.add.sprite(
      x,
      y,
      hero.texture,
      `${hero.framePrefix}0`, // start with the first frame
    )
    // The hero frame is 16×32, twice as tall as a tile. Anchor it at the
    // bottom centre (its feet), so tileToSpritePosition can place the feet in
    // the middle of the tile and let the head stick up into the tile above.
    sprite.setOrigin(0.5, 1)
    // The player is always visible, so they go above the dark.
    sprite.setDepth(PLAYER_DEPTH)
    // Keep the facing from the last room, so going through an exit doesn't
    // turn the player around.
    sprite.setFlipX(this.playerFacing === 'left')
    this.playerSprite = sprite
    this.playIdle(sprite, this.PLAYER_SPRITE)
  }

  // Shows the player's move on screen. The store has already moved the
  // player; this is only the picture catching up, so nothing here may delay
  // input or game state (no turn waits for the slide to finish).
  //
  // A tween changes a property of an object (here the sprite's x and y) a
  // little on every frame, from where it is now to a target value, over a set
  // time. While it slides, the sprite plays its run frames; when the tween
  // completes, it goes back to idle.
  private movePlayerSprite(from: Position | null, to: Position) {
    const sprite = this.playerSprite
    // No sprite yet (no room drawn), so there is nothing to move.
    if (!sprite) return

    // 1. If the last step's slide is still running (arrow keys pressed
    // quickly), stop it. Its onComplete doesn't run, but the code below
    // starts the next slide or the idle loop anyway.
    this.tweens.killTweensOf(sprite)

    // 2. Face the way the player stepped. Flipping isn't motion, so it
    // happens even with reduced motion.
    if (from) {
      this.playerFacing = facingAfterStep(from, to, this.playerFacing)
    }
    // flipX mirrors the picture left to right. The art faces right.
    sprite.setFlipX(this.playerFacing === 'left')

    const target = this.tileToSpritePosition(to)

    // 3. Jump straight to the tile when there's no step to slide (a new room,
    // a blocked move, a jump of more than one tile) or the player prefers
    // reduced motion. This is how the sprite moved before the animations.
    if (from === null || !isSingleStep(from, to) || prefersReducedMotion()) {
      sprite.setPosition(target.x, target.y)
      this.playIdle(sprite, this.PLAYER_SPRITE)
      return
    }

    // 4. Slide. First put the sprite on the tile it's stepping from. Usually
    // it's already there. If a slide was cut short in step 1, it was
    // somewhere between two tiles, and this snaps it on to the tile it was
    // heading for. So the sprite is never more than one tile behind the real
    // position.
    const start = this.tileToSpritePosition(from)
    sprite.setPosition(start.x, start.y)
    // true = ignoreIfPlaying: on quick steps the run loop carries on instead
    // of restarting from its first frame.
    sprite.play(animationKey(this.PLAYER_SPRITE, 'run'), true)

    this.tweens.add({
      targets: sprite,
      x: target.x,
      y: target.y,
      duration: WALK_DURATION,
      // 'Linear' = the same speed the whole way, like a walk.
      ease: 'Linear',
      // The lantern is carried by the player, so the hole in the dark follows
      // the sprite on every frame of the slide instead of jumping ahead to
      // the new tile. The sprite's anchor (its feet) is at the tile centre,
      // the same point the hole is centred on (see tileToSpritePosition and
      // tileCenter), so the sprite's x and y can be used as they are.
      onUpdate: () => {
        this.darkness?.setPosition(sprite.x, sprite.y)
      },
      onComplete: () => {
        // If the player was hit during the slide, the hit frame is showing
        // and its timer will go back to idle. Going to idle here would cut
        // the hit frame short.
        if (!this.hitTimers.has(sprite)) {
          this.playIdle(sprite, this.PLAYER_SPRITE)
        }
      },
    })
  }

  // Shows that a sprite was just hit: a red tint and, if the manifest gives
  // the sprite a hit animation (the heroes have one, frame 8), the hit frame.
  // After HIT_FLASH_DURATION both are cleared and the sprite goes back to
  // idle. Nothing waits for it: like the walk, it is only a picture.
  private flashHit(sprite: Phaser.GameObjects.Sprite, spriteName: SpriteName) {
    // A flash is motion on screen, so it is skipped with reduced motion.
    // The hit is still in the adventure log, like every game event (rule 5).
    if (prefersReducedMotion()) return

    // A second hit before the first flash cleared: cancel the old timer and
    // start a new one below, so there is one longer flash, not two stacked.
    this.hitTimers.get(sprite)?.remove()

    sprite.setTint(HIT_TINT)

    // Object.hasOwn checks the manifest, so the code works for any sprite:
    // the enemies have no hit animation and only get the tint.
    const art = SPRITES[spriteName]
    const hasHitFrame = Object.hasOwn(art.animations, 'hit')
    const hitKey = animationKey(spriteName, 'hit')
    if (hasHitFrame) {
      // The hit animation is one frame that plays once, so the sprite stays
      // on it until something else is played.
      sprite.play(hitKey)
    }

    // delayedCall runs a function once after a delay, on the scene's clock.
    // The clock belongs to the scene, so its timers stop if the scene shuts
    // down.
    const timer = this.time.delayedCall(HIT_FLASH_DURATION, () => {
      this.hitTimers.delete(sprite)
      // destroySprite cancels the timer, so this should never run for a
      // destroyed sprite. `active` is false once a sprite is destroyed, so
      // this check is a second guard that costs nothing.
      if (!sprite.active) return
      sprite.clearTint()
      // Only go back to idle if the hit frame is still showing. If the
      // player has started walking since, the run frames are playing and
      // the walk will go back to idle itself.
      if (hasHitFrame && sprite.anims.currentAnim?.key === hitKey) {
        this.playIdle(sprite, spriteName)
      }
    })
    this.hitTimers.set(sprite, timer)
  }

  // Destroys a sprite and cancels its hit flash timer first, so the timer
  // can't run later on a sprite that no longer exists.
  private destroySprite(sprite: Phaser.GameObjects.Sprite) {
    this.hitTimers.get(sprite)?.remove()
    this.hitTimers.delete(sprite)
    sprite.destroy()
  }

  // Everything that depends on where the lantern shines. The store decides
  // what is where; this method only asks getVisibleTiles which tiles are lit
  // and draws the result (rule 3: no game rules in Phaser code).
  private drawLight(state: GameState) {
    const { grid, playerPosition, enemies, items } = state
    // No room loaded yet, so there is nothing to light.
    if (grid === null || playerPosition === null) return

    // The lantern is carried by the player, so the hole goes where the
    // sprite is drawn, not straight to the player's tile. movePlayerSprite
    // has already run: on a slide the sprite is still on the tile it's
    // leaving (the tween then moves the sprite and the hole together), on a
    // jump it's already on the new tile. The sprite's feet are at the tile
    // centre, the same point the hole is centred on, so its x and y fit.
    //
    // Why not the tile: a Phaser tween doesn't call onUpdate on its first
    // frame (it only reads its start values). Putting the hole on the new
    // tile here showed it one tile ahead for that frame, then it snapped
    // back: a small jolt at the start of every step.
    const { x, y } = this.playerSprite ?? this.tileCenter(playerPosition)
    this.darkness?.setPosition(x, y)

    const visibleTiles = getVisibleTiles(grid, playerPosition, LANTERN_RADIUS)
    this.drawItems(items, visibleTiles)
    this.drawEnemies(enemies, visibleTiles)
  }

  // Draws a sprite for every item on a lit tile, and none for the others,
  // the same way drawEnemies does (keep, remove, make). Picking up isn't
  // decided here: the store has already taken the item out of `items`, so
  // its sprite is simply no longer wanted and is removed in step 1.
  // Items have no animation: they are drawn with one still frame, so there
  // is no motion to switch off for reduced motion.
  private drawItems(items: StoreItem[], visibleTiles: Position[]) {
    const litItems = items.filter((item) => isLit(visibleTiles, item.position))
    const litIds = new Set(litItems.map((item) => item.id))

    // 1. Remove the sprites of items that are no longer lit, or no longer in
    // the store at all (picked up).
    for (const [id, sprite] of this.itemSprites) {
      if (!litIds.has(id)) {
        sprite.destroy()
        this.itemSprites.delete(id)
      }
    }

    // 2. Make a sprite for every newly lit item. Items never move, so a sprite
    // that already exists stays where it is.
    for (const item of litItems) {
      if (this.itemSprites.has(item.id)) continue
      // Rule 7: the sprite is found by its logical name (the item type, e.g.
      // 'gold-key'), never by a file path.
      if (!isSpriteName(item.type)) {
        throw new Error(`No sprite in the asset manifest for ${item.type}`)
      }
      const art = SPRITES[item.type]
      // Item frames are 16×16, the size of one tile, so the default centred
      // origin is right: the middle of the frame goes on the middle of the
      // tile (unlike the 16×32 characters, which stand on their feet).
      const { x, y } = this.tileCenter(item.position)
      const sprite = this.add.sprite(
        x,
        y,
        art.texture,
        `${art.framePrefix}${art.animations.idle.frames[0]}`,
      )
      sprite.setDepth(ITEM_DEPTH)
      this.itemSprites.set(item.id, sprite)
    }
  }

  // Draws a sprite for every enemy on a lit tile, and none for the others.
  // This runs on every step, so an enemy that stays in the light keeps the
  // sprite it already has. Making new sprites each time (as before the
  // animations) would restart every idle loop from its first frame on every
  // step, which looks like a stutter. So: remove the sprites that must go,
  // keep the ones that stay, and make sprites only for newly lit enemies.
  private drawEnemies(enemies: StoreEnemy[], visibleTiles: Position[]) {
    const litEnemies = enemies.filter((enemy) =>
      isLit(visibleTiles, enemy.position),
    )
    const litIds = new Set(litEnemies.map((enemy) => enemy.id))

    // 1. Remove the sprites of enemies that are no longer lit, or no longer
    // in the store at all (defeated). destroy() removes a sprite from the
    // scene and frees it; only hiding it would leave invisible sprites behind.
    // Deleting from a Map while looping over it with for…of is safe in
    // JavaScript: the loop just doesn't visit the deleted entry.
    for (const [id, sprite] of this.enemySprites) {
      if (!litIds.has(id)) {
        this.destroySprite(sprite)
        this.enemySprites.delete(id)
      }
    }

    // 2. Keep or make a sprite for every lit enemy.
    for (const enemy of litEnemies) {
      // Rule 7: the sprite is found by its logical name (the enemy type, e.g.
      // 'demon'), never by a file path.
      if (!isSpriteName(enemy.type)) {
        throw new Error(`No sprite in the asset manifest for ${enemy.type}`)
      }
      const { x, y } = this.tileToSpritePosition(enemy.position)

      let sprite = this.enemySprites.get(enemy.id)
      if (!sprite) {
        const art = SPRITES[enemy.type]
        sprite = this.add.sprite(
          x,
          y,
          art.texture,
          `${art.framePrefix}${art.animations.idle.frames[0]}`,
        )
        // Enemy frames are 16×32 like the hero's, so they use the same
        // bottom-centre origin (see drawPlayer).
        sprite.setOrigin(0.5, 1)
        sprite.setDepth(ENEMY_DEPTH)
        this.enemySprites.set(enemy.id, sprite)
      }
      // Enemies don't move today, but placing a kept sprite again costs
      // nothing and keeps the screen right if they ever do.
      sprite.setPosition(x, y)
      // Starts the loop on a new sprite. On a kept sprite it changes nothing
      // (see playIdle), unless reduced motion was turned on since the last
      // step: then it stops the loop.
      // A disguised mimic stands still as a closed chest ('idle'). When a
      // fight starts, the store removes its disguise, `enemies` changes, this
      // redraw runs, and the sprite switches to its 'unmasked' loop.
      this.playIdle(
        sprite,
        enemy.type,
        enemyAnimationName(
          enemy.disguise !== undefined,
          SPRITES[enemy.type].animations,
        ),
      )
    }
  }

  // Tile position -> the pixel at the middle of that tile. A tile starts at its
  // top-left corner (tile x times the tile size), so the middle is half a tile
  // further. The light is measured from the middle of the player's tile, like
  // the rule in getVisibleTiles. This gives the same numbers as
  // tileToSpritePosition below, but means something else: that one is where a
  // sprite's feet go, this one is the centre of the tile itself.
  private tileCenter(position: Position): { x: number; y: number } {
    return {
      x: position.x * this.tileSize + this.tileSize / 2,
      y: position.y * this.tileSize + this.tileSize / 2,
    }
  }

  // Tile position -> where the sprite's anchor (bottom centre, its feet) goes in
  // pixels: the middle of the tile both ways, so the feet stand in the centre of
  // the tile. With the default centred origin, a 32px-tall sprite would hang
  // half a tile too low.
  private tileToSpritePosition(position: Position): { x: number; y: number } {
    return {
      x: position.x * this.tileSize + this.tileSize / 2,
      y: position.y * this.tileSize + this.tileSize / 2,
    }
  }
}
