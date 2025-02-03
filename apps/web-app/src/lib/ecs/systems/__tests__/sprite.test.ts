import { addComponent, addEntity, createWorld } from 'bitecs'
import { describe, expect, it, vi } from 'vitest'

import { Sprite, Transform } from '../../components'
import type { WorldProps } from '../../types'
import { createSpriteSystem } from '../sprite'

interface MockImage {
  addEventListener: (
    event: string,
    callback: (event?: Event | Error) => void,
  ) => void
  src: string
}

describe.skip('Sprite System', () => {
  it('should load new sprites', () => {
    const world = createWorld<WorldProps>()
    const eid = addEntity(world)

    // Mock Image constructor
    const mockImage: MockImage = {
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'load') {
          callback()
        }
      }),
      src: '',
    }
    const ImageConstructor = vi.fn(() => mockImage) as unknown as typeof Image
    vi.stubGlobal('Image', ImageConstructor)

    // Set up sprite entity
    addComponent(world, eid, Transform)
    addComponent(world, eid, Sprite)
    Sprite.src[eid] = '/test-sprite.png'

    const spriteSystem = createSpriteSystem()
    spriteSystem(world)

    // Verify sprite was loaded
    expect(mockImage.src).toBe('/test-sprite.png')
  })

  it('should cache loaded sprites', () => {
    const world = createWorld<WorldProps>()
    const eid1 = addEntity(world)
    const eid2 = addEntity(world)

    // Mock Image constructor
    const mockImage: MockImage = {
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'load') {
          callback()
        }
      }),
      src: '',
    }
    const ImageConstructor = vi.fn(() => mockImage) as unknown as typeof Image
    vi.stubGlobal('Image', ImageConstructor)

    // Set up sprite entities with same source
    addComponent(world, eid1, Transform)
    addComponent(world, eid1, Sprite)
    Sprite.src[eid1] = '/test-sprite.png'

    addComponent(world, eid2, Transform)
    addComponent(world, eid2, Sprite)
    Sprite.src[eid2] = '/test-sprite.png'

    const spriteSystem = createSpriteSystem()
    spriteSystem(world)

    // Verify only one image was created
    expect(ImageConstructor).toHaveBeenCalledTimes(1)
  })

  it('should handle sprite loading errors', async () => {
    const world = createWorld<WorldProps>()
    const eid = addEntity(world)
    const consoleError = vi.spyOn(console, 'error')

    // Mock Image constructor with error
    const mockImage: MockImage = {
      addEventListener: vi.fn(
        (event: string, callback: (error: Error) => void) => {
          if (event === 'error') {
            // Simulate load error
            callback(new Error('Failed to load sprite'))
          }
        },
      ),
      src: '',
    }
    const ImageConstructor = vi.fn(() => mockImage) as unknown as typeof Image
    vi.stubGlobal('Image', ImageConstructor)

    // Set up sprite entity
    addComponent(world, eid, Transform)
    addComponent(world, eid, Sprite)
    Sprite.src[eid] = '/nonexistent-sprite.png'

    const spriteSystem = createSpriteSystem()
    spriteSystem(world)

    // Wait for error to be logged
    await new Promise<void>((resolve) => setTimeout(resolve, 0))

    // Verify error was logged
    expect(consoleError).toHaveBeenCalled()
  })

  it('should ignore empty sprite sources', () => {
    const world = createWorld<WorldProps>()
    const eid = addEntity(world)

    // Mock Image constructor
    const mockImage: MockImage = {
      addEventListener: vi.fn((_event: string, _callback: () => void) => {
        // Empty implementation for testing
        return
      }),
      src: '',
    }
    const ImageConstructor = vi.fn(() => mockImage) as unknown as typeof Image
    vi.stubGlobal('Image', ImageConstructor)

    // Set up sprite entity with empty source
    addComponent(world, eid, Transform)
    addComponent(world, eid, Sprite)
    Sprite.src[eid] = ''

    const spriteSystem = createSpriteSystem()
    spriteSystem(world)

    // Verify no sprite was loaded
    expect(ImageConstructor).not.toHaveBeenCalled()
  })
})
