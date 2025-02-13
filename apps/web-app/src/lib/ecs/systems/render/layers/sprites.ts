import { query } from 'bitecs'

import { Sprite, Transform } from '../../../components'
import { spriteCache } from '../../sprite'
import type { RenderContext, RenderLayer } from '../types'
import { RENDER_LAYERS } from '../types'

export class SpriteLayer implements RenderLayer {
  name = 'sprites'
  order = RENDER_LAYERS.ENTITIES

  render({ world, ctx }: RenderContext): void {
    const sprites = query(world, [Transform, Sprite])

    // Sort sprites by y position for proper layering
    const sortedSprites = [...sprites].sort((a, b) => {
      const yA = Transform.y[a] ?? 0
      const yB = Transform.y[b] ?? 0
      return yA - yB
    })

    for (const eid of sortedSprites) {
      // Skip invisible sprites
      if (!(Sprite.isVisible[eid] ?? 1)) continue

      const source = Sprite.src[eid]
      if (!source || typeof source !== 'string') continue

      const sprite = spriteCache.get(source)
      if (!sprite) continue

      const x = Transform.x[eid] ?? 0
      const y = Transform.y[eid] ?? 0
      const offsetX = Sprite.offsetX[eid] ?? 0
      const offsetY = Sprite.offsetY[eid] ?? 0
      const frameWidth = Sprite.frameWidth[eid] ?? sprite.width
      const frameHeight = Sprite.frameHeight[eid] ?? sprite.height
      const frame = Sprite.frame[eid] ?? 0
      const scaleX = Sprite.scaleX[eid] ?? 1
      const scaleY = Sprite.scaleY[eid] ?? 1
      const rotation = Sprite.rotation[eid] ?? 0
      const opacity = Sprite.opacity[eid] ?? 1
      const isFlipped = Sprite.isFlipped[eid] ?? 0

      // Transform context
      ctx.translate(x + offsetX, y + offsetY)
      ctx.rotate(rotation)
      ctx.scale(isFlipped ? -scaleX : scaleX, scaleY)
      ctx.globalAlpha = opacity

      // Calculate source frame rectangle
      // Calculate source frame rectangle
      const sx = (frame * frameWidth) % sprite.width
      const sy = Math.floor((frame * frameWidth) / sprite.width) * frameHeight

      // Draw sprite frame
      ctx.drawImage(
        sprite,
        sx,
        sy,
        frameWidth,
        frameHeight,
        -frameWidth / 2,
        -frameHeight / 2,
        frameWidth,
        frameHeight,
      )
    }
  }
}
