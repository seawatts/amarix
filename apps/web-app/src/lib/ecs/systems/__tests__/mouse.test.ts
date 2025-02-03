import {
  IsA,
  addComponent,
  addEntity,
  addPrefab,
  createEntityIndex,
  createWorld,
} from 'bitecs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  Box,
  Camera,
  Circle,
  Clickable,
  Debug,
  GlobalMouseState,
  Hoverable,
  Polygon,
  Transform,
} from '../../components'
import type { WorldProps } from '../../types'
import { initialGameWorldState } from '../../world'
import { createMouseSystem } from '../mouse'

describe('Mouse System', () => {
  let entityIndex: ReturnType<typeof createEntityIndex>
  let world: ReturnType<typeof createWorld<WorldProps>>
  let cameraEid: number
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // Create a shared entity index for all worlds
    entityIndex = createEntityIndex()

    // Create world with the shared entity index
    world = createWorld<WorldProps>(entityIndex, initialGameWorldState)
    world.prefabs.shape = addPrefab(world)
    cameraEid = addEntity(world)

    // Reset global mouse state
    GlobalMouseState.screenX = 400 // Center of 800x600 canvas
    GlobalMouseState.screenY = 300
    GlobalMouseState.buttonsDown = 0
    GlobalMouseState.clickedEntity = 0
    GlobalMouseState.hoveredEntity = 0
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

    // Set up canvas
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
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

  it('should detect hovering over box shapes', () => {
    const boxEid = addEntity(world)

    // Set up box entity
    addComponent(world, boxEid, Transform)
    addComponent(world, boxEid, Box)
    addComponent(world, boxEid, Hoverable)
    addComponent(world, boxEid, IsA(world.prefabs.shape))
    Transform.x[boxEid] = 0
    Transform.y[boxEid] = 0
    Box.width[boxEid] = 100
    Box.height[boxEid] = 100

    const mouseSystem = createMouseSystem(canvas)
    mouseSystem(world)

    // Mouse should be over the box
    expect(Hoverable.isHovered[boxEid]).toBe(1)
  })

  it('should detect hovering over circle shapes', () => {
    const circleEid = addEntity(world)

    // Set up circle entity
    addComponent(world, circleEid, Transform)
    addComponent(world, circleEid, Circle)
    addComponent(world, circleEid, Hoverable)
    addComponent(world, circleEid, IsA(world.prefabs.shape))
    Transform.x[circleEid] = 0
    Transform.y[circleEid] = 0
    Circle.radius[circleEid] = 100

    const mouseSystem = createMouseSystem(canvas)
    mouseSystem(world)

    // Mouse should be over the circle
    expect(Hoverable.isHovered[circleEid]).toBe(1)
  })

  it('should handle mouse clicks on clickable entities', () => {
    const boxEid = addEntity(world)

    // Set up clickable box entity
    addComponent(world, boxEid, Transform)
    addComponent(world, boxEid, Box)
    addComponent(world, boxEid, Clickable)
    addComponent(world, boxEid, IsA(world.prefabs.shape))
    Transform.x[boxEid] = 0
    Transform.y[boxEid] = 0
    Box.width[boxEid] = 100
    Box.height[boxEid] = 100

    // Simulate mouse click
    GlobalMouseState.buttonsDown = 1 // Left mouse button pressed

    const mouseSystem = createMouseSystem(canvas)
    mouseSystem(world)

    // Entity should be clicked
    expect(Clickable.isClicked[boxEid]).toBe(1)
  })

  it('should handle debug entities', () => {
    const debugEid = addEntity(world)

    // Set up debug entity
    addComponent(world, debugEid, Transform)
    addComponent(world, debugEid, Box)
    addComponent(world, debugEid, Debug)
    addComponent(world, debugEid, IsA(world.prefabs.shape))
    Transform.x[debugEid] = 0
    Transform.y[debugEid] = 0
    Box.width[debugEid] = 100
    Box.height[debugEid] = 100

    // Simulate mouse click
    GlobalMouseState.buttonsDown = 1

    const mouseSystem = createMouseSystem(canvas)
    mouseSystem(world)

    // Debug entity should be hovered and clicked
    expect(Debug.hoveredEntity[debugEid]).toBe(1)
    expect(Debug.clickedEntity[debugEid]).toBe(1)
    expect(GlobalMouseState.hoveredEntity).toBe(debugEid)
    expect(GlobalMouseState.clickedEntity).toBe(debugEid)
  })

  it('should detect hovering and clicking over polygon shapes', () => {
    const polygonEid = addEntity(world)

    // Set up polygon entity
    addComponent(world, polygonEid, Transform)
    addComponent(world, polygonEid, Polygon)
    addComponent(world, polygonEid, Hoverable)
    addComponent(world, polygonEid, Clickable)
    addComponent(world, polygonEid, IsA(world.prefabs.shape))
    Transform.x[polygonEid] = 0
    Transform.y[polygonEid] = 0

    // Create a triangle shape
    Polygon.vertexCount[polygonEid] = 3
    Polygon.verticesX[polygonEid] = new Float32Array([-50, 50, 0])
    Polygon.verticesY[polygonEid] = new Float32Array([-50, -50, 50])

    // Simulate mouse click
    GlobalMouseState.buttonsDown = 1

    const mouseSystem = createMouseSystem(canvas)
    mouseSystem(world)

    // Polygon should be hovered and clicked
    expect(Hoverable.isHovered[polygonEid]).toBe(1)
    expect(Clickable.isClicked[polygonEid]).toBe(1)
    expect(GlobalMouseState.hoveredEntity).toBe(polygonEid)
    expect(GlobalMouseState.clickedEntity).toBe(polygonEid)
  })
})
