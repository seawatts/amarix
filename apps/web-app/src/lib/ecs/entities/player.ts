import { IsA, addComponent, addEntity } from 'bitecs'

import {
  Acceleration,
  Clickable,
  Collidable,
  CollisionMask,
  CurrentPlayer,
  Force,
  Gravity,
  Health,
  Named,
  Player,
  Polygon,
  RigidBody,
  SaveableMapEntity,
  Sound,
  Sprite,
  Style,
  Transform,
  Velocity,
} from '../components'
import { PIXELS_PER_METER } from '../systems/physics'
import type { World } from '../types'
// Increased rotational resistance

import { createDebug } from './debug'

// Player dimensions (1 meter x 1 meter)
const PLAYER_SIZE = PIXELS_PER_METER

// Physics constants
const GRAVITY = 9.81 // m/s²
const PLAYER_MASS = 70 // kg
const PLAYER_FRICTION = 0.2 // Increased friction for better control
const PLAYER_RESTITUTION = 0.1 // Reduced bounciness
const PLAYER_LINEAR_DAMPING = 0.9 // Increased air resistance for better control
const PLAYER_ANGULAR_DAMPING = 0.95

// Game constants
const INITIAL_HEALTH = 100
const PLAYER_FOOTSTEP = '/sounds/footstep.mp3'

function createBoxPolygon(
  width: number,
  height: number,
): { x: Float32Array; y: Float32Array } {
  const halfWidth = width / 2
  const halfHeight = height / 2

  // Create vertices for a box (clockwise order)
  const x = new Float32Array(4)
  const y = new Float32Array(4)

  // Top-left
  x[0] = -halfWidth
  y[0] = -halfHeight

  // Top-right
  x[1] = halfWidth
  y[1] = -halfHeight

  // Bottom-right
  x[2] = halfWidth
  y[2] = halfHeight

  // Bottom-left
  x[3] = -halfWidth
  y[3] = halfHeight

  return { x, y }
}

interface CreatePlayerOptions {
  x: number
  y: number
}

export function createPlayer(world: World, options: CreatePlayerOptions) {
  const eid = addEntity(world)

  // Initialize player state
  CurrentPlayer.eid[eid] = eid
  // Add player components
  addComponent(
    world,
    eid,
    Transform,
    Player,
    Health,
    CurrentPlayer,
    Polygon,
    IsA(world.prefabs.shape),
    RigidBody,
    Collidable,
    Clickable,
    Sprite,
    Sound,
    Gravity,
    Acceleration,
    Velocity,
    Force,
    Named,
    Style,
    SaveableMapEntity,
  )
  // Initialize physics properties
  // Set player values
  Transform.x[eid] = options.x
  Transform.y[eid] = options.y
  Transform.rotation[eid] = 0
  Transform.scaleX[eid] = 1
  Transform.scaleY[eid] = 1
  Player.eid[eid] = 1
  Health.current[eid] = INITIAL_HEALTH
  Health.max[eid] = INITIAL_HEALTH
  CurrentPlayer.eid[eid] = 1
  RigidBody.restitution[eid] = 0.5
  // Set physics values for player
  Velocity.x[eid] = 0
  Velocity.y[eid] = 0
  Acceleration.x[eid] = 0
  Acceleration.y[eid] = 0
  Force.x[eid] = 0
  Force.y[eid] = 0
  RigidBody.mass[eid] = PLAYER_MASS
  RigidBody.friction[eid] = PLAYER_FRICTION
  RigidBody.restitution[eid] = PLAYER_RESTITUTION
  RigidBody.isStatic[eid] = 0
  RigidBody.linearDamping[eid] = PLAYER_LINEAR_DAMPING
  RigidBody.angularDamping[eid] = PLAYER_ANGULAR_DAMPING
  Gravity.x[eid] = 0
  Gravity.y[eid] = GRAVITY

  // Set player polygon
  const playerBox = createBoxPolygon(PLAYER_SIZE, PLAYER_SIZE)
  Polygon.isConvex[eid] = 1
  Polygon.rotation[eid] = 0
  Polygon.vertexCount[eid] = 4
  Polygon.originX[eid] = 0
  Polygon.originY[eid] = 0
  Polygon.verticesX[eid] = playerBox.x
  Polygon.verticesY[eid] = playerBox.y

  // Set collision values for player
  Collidable.isActive[eid] = 1
  Collidable.isTrigger[eid] = 0
  Collidable.layer[eid] = CollisionMask.Player
  Collidable.mask[eid] =
    CollisionMask.Wall |
    CollisionMask.NPC |
    CollisionMask.Item |
    CollisionMask.Trigger

  // Set bounding box size
  // Set sound values for player
  Sound.src[eid] = PLAYER_FOOTSTEP
  Sound.isPlaying[eid] = 0
  Sound.isLooping[eid] = 0
  Sound.volume[eid] = 0.5
  Sound.playbackRate[eid] = 1
  Sound.panX[eid] = 0
  Sound.panY[eid] = 0
  Sound.maxDistance[eid] = 500 // Set name
  Named.name[eid] = 'Player'
  createDebug(world, eid)
  Style.strokeColor[eid] = '#ffffff'
  Style.strokeWidth[eid] = 2
  Style.fillOpacity[eid] = 1

  // Initialize SaveableMapEntity
  SaveableMapEntity.eid[eid] = eid

  return eid
}
