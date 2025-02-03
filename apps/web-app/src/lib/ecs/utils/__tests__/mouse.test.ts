import {
  addComponent,
  addEntity,
  addPrefab,
  createEntityIndex,
  createWorld,
} from 'bitecs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Camera, GlobalMouseState, Transform } from '../../components'
import { createMouseSystem } from '../../systems/mouse'
import type { World, WorldProps } from '../../types'
import { initialGameWorldState } from '../../world'
import {
  MOUSE_BUTTONS,
  clearMouseButtonDown,
  getCanvasCoordinates,
  getMouseState,
  isMouseButtonDown,
  setClickedEntity,
  setHoveredEntity,
  setMouseButtonDown,
  updateMousePosition,
} from '../mouse'

describe('Mouse Utils', () => {
  let entityIndex: ReturnType<typeof createEntityIndex>
  let world: ReturnType<typeof createWorld<WorldProps>>

  beforeEach(() => {
    // Create a shared entity index for all worlds
    entityIndex = createEntityIndex()

    // Create world with the shared entity index
    world = createWorld<WorldProps>(entityIndex, initialGameWorldState)
    world.prefabs.shape = addPrefab(world)

    // Reset global mouse state
    GlobalMouseState.buttonsDown = 0
    GlobalMouseState.clickedEntity = 0
    GlobalMouseState.hoveredEntity = 0
    GlobalMouseState.screenX = 0
    GlobalMouseState.screenY = 0
    GlobalMouseState.worldX = 0
    GlobalMouseState.worldY = 0
  })

  afterEach(() => {
    // Reset global mouse state
    GlobalMouseState.buttonsDown = 0
    GlobalMouseState.clickedEntity = 0
    GlobalMouseState.hoveredEntity = 0
    GlobalMouseState.screenX = 0
    GlobalMouseState.screenY = 0
    GlobalMouseState.worldX = 0
    GlobalMouseState.worldY = 0
  })

  describe('Canvas Coordinates', () => {
    it('should calculate canvas coordinates correctly', () => {
      const canvas = {
        getBoundingClientRect: () => ({
          height: 600,
          left: 100,
          top: 50,
          width: 800,
        }),
        height: 600,
        width: 800,
      } as HTMLCanvasElement

      const event = {
        clientX: 300,
        clientY: 150,
      } as MouseEvent

      const coords = getCanvasCoordinates(event, canvas)
      expect(coords).toEqual({ x: 200, y: 100 })
    })

    it('should handle scaled canvas', () => {
      const canvas = {
        getBoundingClientRect: () => ({
          // Canvas displayed at half size
          height: 300,
          left: 100,
          top: 50,
          width: 400,
        }),
        height: 600,
        width: 800,
      } as HTMLCanvasElement

      const event = {
        clientX: 300,
        clientY: 150,
      } as MouseEvent

      const coords = getCanvasCoordinates(event, canvas)
      expect(coords).toEqual({ x: 400, y: 200 }) // Coordinates scaled up
    })
  })

  describe('Mouse Button State', () => {
    it('should manage mouse button states correctly', () => {
      // Initially no buttons are pressed
      expect(isMouseButtonDown(MOUSE_BUTTONS.LEFT)).toBe(false)
      expect(isMouseButtonDown(MOUSE_BUTTONS.RIGHT)).toBe(false)

      // Press left button
      setMouseButtonDown(MOUSE_BUTTONS.LEFT)
      expect(isMouseButtonDown(MOUSE_BUTTONS.LEFT)).toBe(true)
      expect(isMouseButtonDown(MOUSE_BUTTONS.RIGHT)).toBe(false)

      // Press right button
      setMouseButtonDown(MOUSE_BUTTONS.RIGHT)
      expect(isMouseButtonDown(MOUSE_BUTTONS.LEFT)).toBe(true)
      expect(isMouseButtonDown(MOUSE_BUTTONS.RIGHT)).toBe(true)

      // Clear left button
      clearMouseButtonDown(MOUSE_BUTTONS.LEFT)
      expect(isMouseButtonDown(MOUSE_BUTTONS.LEFT)).toBe(false)
      expect(isMouseButtonDown(MOUSE_BUTTONS.RIGHT)).toBe(true)
    })
  })

  describe('Mouse Position', () => {
    it('should update mouse position correctly', () => {
      updateMousePosition(100, 200, 300, 400)

      expect(GlobalMouseState.screenX).toBe(100)
      expect(GlobalMouseState.screenY).toBe(200)
      expect(GlobalMouseState.worldX).toBe(300)
      expect(GlobalMouseState.worldY).toBe(400)
    })
  })

  describe('Entity Interaction', () => {
    it('should manage entity hover and click states', () => {
      const entityId = 42

      setHoveredEntity(entityId)
      expect(GlobalMouseState.hoveredEntity).toBe(entityId)

      setClickedEntity(entityId)
      expect(GlobalMouseState.clickedEntity).toBe(entityId)
    })
  })

  describe('Mouse State', () => {
    it('should get complete mouse state', () => {
      // Setup initial state
      updateMousePosition(100, 200, 300, 400)
      setHoveredEntity(42)
      setClickedEntity(43)
      setMouseButtonDown(MOUSE_BUTTONS.LEFT)

      const state = getMouseState()
      expect(state).toEqual({
        buttons: {
          left: true,
          middle: false,
          right: false,
        },
        clickedEntity: 43,
        hoveredEntity: 42,
        position: {
          screen: {
            x: 100,
            y: 200,
          },
          world: {
            x: 300,
            y: 400,
          },
        },
      })
    })

    it('should handle initial state values', () => {
      const state = getMouseState()
      expect(state).toEqual({
        buttons: {
          left: false,
          middle: false,
          right: false,
        },
        clickedEntity: 0,
        hoveredEntity: 0,
        position: {
          screen: {
            x: 0,
            y: 0,
          },
          world: {
            x: 0,
            y: 0,
          },
        },
      })
    })
  })
})

describe('Mouse Coordinate Transformations', () => {
  let entityIndex: ReturnType<typeof createEntityIndex>
  let world: World
  let cameraEid: number

  beforeEach(() => {
    // Create a shared entity index for all worlds
    entityIndex = createEntityIndex()

    // Create world with the shared entity index
    world = createWorld<WorldProps>(entityIndex, initialGameWorldState)
    world.prefabs.shape = addPrefab(world)
    cameraEid = addEntity(world)

    // Reset global mouse state
    GlobalMouseState.buttonsDown = 0
    GlobalMouseState.clickedEntity = 0
    GlobalMouseState.hoveredEntity = 0
    GlobalMouseState.screenX = 400 // Center of canvas
    GlobalMouseState.screenY = 300
    GlobalMouseState.worldX = 0
    GlobalMouseState.worldY = 0

    // Set up camera entity
    addComponent(world, cameraEid, Camera)
    addComponent(world, cameraEid, Transform)
    Camera.isActive[cameraEid] = 1
    Camera.zoom[cameraEid] = 1
    Transform.x[cameraEid] = 0
    Transform.y[cameraEid] = 0
    Transform.rotation[cameraEid] = 0
  })

  afterEach(() => {
    // Reset global mouse state
    GlobalMouseState.buttonsDown = 0
    GlobalMouseState.clickedEntity = 0
    GlobalMouseState.hoveredEntity = 0
    GlobalMouseState.screenX = 0
    GlobalMouseState.screenY = 0
    GlobalMouseState.worldX = 0
    GlobalMouseState.worldY = 0
  })

  it('should maintain stable world coordinates over multiple frames', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600

    const mouseSystem = createMouseSystem(canvas)

    // Track world coordinates over multiple frames
    const coordinates: { x: number; y: number }[] = []

    // Run multiple frames
    for (let index = 0; index < 10; index++) {
      mouseSystem(world)
      coordinates.push({
        x: GlobalMouseState.worldX,
        y: GlobalMouseState.worldY,
      })
    }

    // Log all coordinates for debugging
    console.log('Mouse coordinates over frames:', coordinates)

    // Verify coordinates remain stable
    const initialX = coordinates[0]?.x ?? 0
    const initialY = coordinates[0]?.y ?? 0

    for (const coord of coordinates) {
      expect(coord.x).toBeCloseTo(initialX, 2)
      expect(coord.y).toBeCloseTo(initialY, 2)
    }
  })
})
