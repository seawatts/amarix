/* eslint-disable unicorn/prefer-math-trunc */
// Position component for storing entity position
import { f32, u8, u32 } from "bitecs/serialization";

const baseInitializationSize = 10_000;

export const Transform = {
  _name: "Transform",
  rotation: f32(Array.from({ length: baseInitializationSize })),
  scaleX: f32(Array.from({ length: baseInitializationSize })),
  scaleY: f32(Array.from({ length: baseInitializationSize })),
  x: f32(Array.from({ length: baseInitializationSize })),
  y: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Camera component for controlling view
export const Camera = {
  _name: "Camera",
  isActive: u8(Array.from({ length: baseInitializationSize })),
  isPanning: u8(Array.from({ length: baseInitializationSize })), // Whether the camera is currently being panned
  lastPanX: f32(Array.from({ length: baseInitializationSize })), // Last mouse X position during pan
  lastPanY: f32(Array.from({ length: baseInitializationSize })), // Last mouse Y position during pan
  maxX: f32(Array.from({ length: baseInitializationSize })),
  maxY: f32(Array.from({ length: baseInitializationSize })),
  minX: f32(Array.from({ length: baseInitializationSize })),
  minY: f32(Array.from({ length: baseInitializationSize })),
  smoothing: f32(Array.from({ length: baseInitializationSize })),
  target: u32(Array.from({ length: baseInitializationSize })),
  zoom: f32(Array.from({ length: baseInitializationSize })),
} as const;

export const Velocity = {
  _name: "Velocity",
  x: f32(Array.from({ length: baseInitializationSize })),
  y: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Movement component for storing movement input
export const Movement = {
  _name: "Movement",
  dx: f32(Array.from({ length: baseInitializationSize })),
  dy: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Tag component to identify the player entity
export const Player = {
  _name: "Player",
  eid: u32(Array.from({ length: baseInitializationSize })),
} as const;

export const CurrentPlayer = {
  _name: "CurrentPlayer",
  eid: u32(Array.from({ length: baseInitializationSize })),
} as const;

// Tag component to identify NPC entities
export const NPC = {
  _name: "NPC",
  eid: u32(Array.from({ length: baseInitializationSize })),
} as const;

// Tag component to identify hostile NPCs
export const HostileNPC = {
  _name: "HostileNPC",
  eid: u32(Array.from({ length: baseInitializationSize })),
  isHostile: u8(Array.from({ length: baseInitializationSize })),
} as const;

// Component to store NPC interaction data
export const NPCInteraction = {
  _name: "NPCInteraction",
  isInteracting: u8(Array.from({ length: baseInitializationSize })),
  message: Array.from({ length: 100 }).fill(""),
} as const;

// Component to store interaction cooldown
export const InteractionCooldown = {
  _name: "InteractionCooldown",
  timer: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Component to store battle state
export const BattleState = {
  _name: "BattleState",
  enemyPosition: {
    x: f32(Array.from({ length: baseInitializationSize })),
    y: f32(Array.from({ length: baseInitializationSize })),
  },
  isActive: u8(Array.from({ length: baseInitializationSize })),
  playerPosition: {
    x: f32(Array.from({ length: baseInitializationSize })),
    y: f32(Array.from({ length: baseInitializationSize })),
  },
  turn: u8(Array.from({ length: baseInitializationSize })), // 0 = player turn, 1 = enemy turn
} as const;

// Tag component to identify entities in battle
export const InBattle = {
  _name: "InBattle",
  eid: u32(Array.from({ length: baseInitializationSize })),
} as const;

// Component to store health data
export const Health = {
  _name: "Health",
  current: f32(Array.from({ length: baseInitializationSize })),
  max: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Component to store battle action data
export const BattleAction = {
  _name: "BattleAction",
  // "move" | "attack"
  targetX: f32(Array.from({ length: baseInitializationSize })),
  targetY: f32(Array.from({ length: baseInitializationSize })),
  type: Array.from({ length: 100 }).fill(""),
} as const;

// Component to store valid moves/actions
export const ValidActions = {
  _name: "ValidActions",
  cells: Array.from({ length: 100 }).fill([]), // Array of {x: number, y: number}[]
} as const;

// Input state using bit fields for multiple key tracking
export const GlobalKeyboardState = {
  _name: "GlobalKeyboardState",

  // Single value to track all keys (using bit field)
  keys: 0 as number,

  // Map to store all pressed keys
  pressedKeys: new Set<string>(),
} as const;

// Global mouse state
export const GlobalMouseState = {
  _name: "GlobalMouseState",

  // Mouse buttons state (using bit field like keyboard)
  // Bit 0: Left button
  // Bit 1: Right button
  // Bit 2: Middle button
  buttonsDown: 0,

  // Entity being clicked (0 if none)
  clickedEntity: 0,

  // Entity being hovered over (0 if none)
  hoveredEntity: 0,

  // Current mouse position in screen coordinates
  screenX: 0,
  screenY: 0,

  // Current mouse position in world coordinates
  worldX: 0,
  worldY: 0,
};

// BoundingBox component for collision detection and interaction areas
export const BoundingBox = {
  _name: "BoundingBox",
  height: f32(Array.from({ length: baseInitializationSize })),
  width: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Polygon component for complex shapes
export const Polygon = {
  _name: "Polygon",

  // Flag for convex polygons (allows for optimization)
  isConvex: u8(Array.from({ length: baseInitializationSize })),

  // Center/origin point of the polygon
  originX: f32(Array.from({ length: baseInitializationSize })),
  originY: f32(Array.from({ length: baseInitializationSize })),

  // Rotation in radians
  rotation: f32(Array.from({ length: baseInitializationSize })),

  // Number of vertices in the polygon
  vertexCount: u32(Array.from({ length: baseInitializationSize })),

  // Vertex coordinates stored as separate X and Y arrays for better performance
  verticesX: Array.from({ length: 100 }).fill(
    f32(Array.from({ length: baseInitializationSize })),
  ) as Float32Array[],
  verticesY: Array.from({ length: 100 }).fill(
    f32(Array.from({ length: baseInitializationSize })),
  ) as Float32Array[],
} as const;

// Physics components
export const RigidBody = {
  _name: "RigidBody",

  angularDamping: f32(Array.from({ length: baseInitializationSize })),

  // reduce angular velocity over time
  angularVelocity: f32(Array.from({ length: baseInitializationSize })),
  // rotation speed in rad/sec
  friction: f32(Array.from({ length: baseInitializationSize })),

  isStatic: new Int8Array(baseInitializationSize),

  // 1 = immovable, 0 = movable
  linearDamping: f32(Array.from({ length: baseInitializationSize })),
  // reduce linear velocity over time
  mass: f32(Array.from({ length: baseInitializationSize })),
  momentOfInertia: f32(Array.from({ length: baseInitializationSize })), // rotational inertia (simplified)
  restitution: f32(Array.from({ length: baseInitializationSize })),
  rotation: f32(Array.from({ length: baseInitializationSize })), // rotation in radians
} as const;

export enum CollisionMask {
  Player = 1 << 0,
  NPC = 1 << 1,
  Wall = 1 << 2,
  Item = 1 << 3,
  Trigger = 1 << 4,
}

// Collision components
export const Collidable = {
  _name: "Collidable",

  // Collision flags
  isActive: new Int8Array(baseInitializationSize),

  // 1 = can collide, 0 = no collision
  isTrigger: new Int8Array(baseInitializationSize),

  // 1 = trigger events only, 0 = physical collision
  // Collision layers (for filtering)
  layer: new Int32Array(baseInitializationSize),
  // Which layer this entity belongs to
  mask: new Int32Array(baseInitializationSize), // Bit mask of layers this can collide with
} as const;

// Collision manifold component - stores collision data
export const CollisionManifold = {
  _name: "CollisionManifold",

  // How deep the collision is
  contactPointX: f32(Array.from({ length: baseInitializationSize })),

  // Point of contact X
  contactPointY: f32(Array.from({ length: baseInitializationSize })),

  // Entity references
  entity1: new Int32Array(baseInitializationSize),

  // First entity in collision
  entity2: new Int32Array(baseInitializationSize),

  // Second entity in collision
  // Collision normal (direction of impact)
  normalX: f32(Array.from({ length: baseInitializationSize })),

  normalY: f32(Array.from({ length: baseInitializationSize })),
  // Collision details
  penetrationDepth: f32(Array.from({ length: baseInitializationSize })), // Point of contact Y
} as const;

// Component for trigger zones that can start quests, battles, or other events
export const TriggerZone = {
  _name: "TriggerZone",

  // ID of the quest/battle/dialog to trigger
  actionId: u32(Array.from({ length: baseInitializationSize })),

  // Cooldown time in milliseconds before trigger can be used again (if repeatable)
  cooldown: f32(Array.from({ length: baseInitializationSize })),

  // Whether this trigger has been activated
  isActivated: u8(Array.from({ length: baseInitializationSize })),

  // Whether this trigger can be used multiple times
  isRepeatable: u8(Array.from({ length: baseInitializationSize })),

  // Last time the trigger was activated (for cooldown)
  lastActivatedTime: f32(Array.from({ length: baseInitializationSize })),

  // Type of trigger: "quest" | "battle" | "dialog" | "checkpoint" etc.
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

export const Hoverable = {
  _name: "Hoverable",
  isHovered: u8(Array.from({ length: baseInitializationSize })),
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

export const Clickable = {
  _name: "Clickable",
  isClicked: u8(Array.from({ length: baseInitializationSize })),
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

// Script component to define entity behaviors
export const Script = {
  _name: "Script",

  // Whether the script is active
  isActive: u8(Array.from({ length: baseInitializationSize })),
  // Function index in the script registry
  scriptId: f32(Array.from({ length: baseInitializationSize })),
  // State data for the script
  state: f32(Array.from({ length: baseInitializationSize })),
  // Timer for time-based scripts
  timer: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Sprite component for rendering images
export const Sprite = {
  _name: "Sprite",

  // Current animation frame index
  frame: u32(Array.from({ length: baseInitializationSize })),

  // Sprite sheet frame dimensions
  frameHeight: f32(Array.from({ length: baseInitializationSize })),

  // Current animation sequence name
  frameSequence: Array.from({ length: 100 }).fill(""),

  frameWidth: f32(Array.from({ length: baseInitializationSize })),

  // Whether the sprite is flipped horizontally
  isFlipped: u8(Array.from({ length: baseInitializationSize })),

  // Whether the sprite is visible
  isVisible: u8(Array.from({ length: baseInitializationSize })),

  // Sprite offset from position
  offsetX: f32(Array.from({ length: baseInitializationSize })),

  offsetY: f32(Array.from({ length: baseInitializationSize })),

  // Sprite opacity (0-1)
  opacity: f32(Array.from({ length: baseInitializationSize })),

  // Sprite rotation in radians
  rotation: f32(Array.from({ length: baseInitializationSize })),

  // Sprite scale
  scaleX: f32(Array.from({ length: baseInitializationSize })),

  scaleY: f32(Array.from({ length: baseInitializationSize })),
  // Sprite sheet source path
  src: Array.from<string>({ length: 100 }).fill(""),
} as const;

// Animation component for sprite animations
export const Animation = {
  _name: "Animation",

  // Current animation sequence name
  currentSequence: Array.from({ length: 100 }).fill(""),

  // Duration of each frame in milliseconds
  frameDuration: f32(Array.from({ length: baseInitializationSize })),

  // Whether the animation should loop
  isLooping: u8(Array.from({ length: baseInitializationSize })),

  // Whether the animation is playing
  isPlaying: u8(Array.from({ length: baseInitializationSize })),
  // Time elapsed in current frame
  timer: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Sound component for audio playback
export const Sound = {
  _name: "Sound",

  // Whether the sound should loop
  isLooping: u8(Array.from({ length: baseInitializationSize })),

  // Whether the sound is playing
  isPlaying: u8(Array.from({ length: baseInitializationSize })),

  // Maximum distance at which the sound can be heard
  maxDistance: f32(Array.from({ length: baseInitializationSize })),
  // Sound spatial position relative to listener
  panX: f32(Array.from({ length: baseInitializationSize })),
  panY: f32(Array.from({ length: baseInitializationSize })),
  // Sound playback rate (1 = normal speed)
  playbackRate: f32(Array.from({ length: baseInitializationSize })),
  // Current sound source path
  src: Array.from<string>({ length: 100 }).fill(""),
  // Sound volume (0-1)
  volume: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Scene component for managing game scenes
export const Scene = {
  _name: "Scene",

  // Current scene name
  current: Array.from<string>({ length: 1 }).fill(""),

  // Scene-specific data
  data: Array.from<Record<string, unknown>>({ length: 1 }).fill({}),

  // Whether a scene transition is in progress
  isTransitioning: u8(Array.from({ length: baseInitializationSize })),
  // Next scene to transition to
  next: Array.from<string>({ length: 1 }).fill(""),

  // Scene transition duration in milliseconds
  transitionDuration: f32(Array.from({ length: baseInitializationSize })),

  // Scene transition progress (0-1)
  transitionProgress: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Particle component for visual effects
export const Particle = {
  _name: "Particle",

  // Current alpha/opacity (0-1)
  alpha: f32(Array.from({ length: baseInitializationSize })),

  // Color in hex format
  color: Array.from<string>({ length: 100 }).fill("#ffffff"),

  // Whether the particle is active
  isActive: u8(Array.from({ length: baseInitializationSize })),

  // Current life of particle (0-1)
  life: f32(Array.from({ length: baseInitializationSize })),

  // Maximum lifetime in milliseconds
  maxLife: f32(Array.from({ length: baseInitializationSize })),
  // Size
  size: f32(Array.from({ length: baseInitializationSize })),
  // Velocity
  velocityX: f32(Array.from({ length: baseInitializationSize })),
  velocityY: f32(Array.from({ length: baseInitializationSize })),
  // Position
  x: f32(Array.from({ length: baseInitializationSize })),
  y: f32(Array.from({ length: baseInitializationSize })),
} as const;

// ParticleEmitter component for spawning particles
export const ParticleEmitter = {
  _name: "ParticleEmitter",

  // Emission rate (particles per second)
  emissionRate: f32(Array.from({ length: baseInitializationSize })),

  // Time since last emission
  emissionTimer: f32(Array.from({ length: baseInitializationSize })),

  // Whether the emitter is active
  isActive: u8(Array.from({ length: baseInitializationSize })),

  // Maximum number of particles to emit (-1 for infinite)
  maxParticles: new Int32Array(baseInitializationSize),
  // Particle configuration
  particleAlpha: f32(Array.from({ length: baseInitializationSize })),
  particleColor: Array.from<string>({ length: 100 }).fill("#ffffff"),
  particleLife: f32(Array.from({ length: baseInitializationSize })),
  particleSize: f32(Array.from({ length: baseInitializationSize })),
  particleSpeedMax: f32(Array.from({ length: baseInitializationSize })),
  particleSpeedMin: f32(Array.from({ length: baseInitializationSize })),
  // Spawn area
  spawnRadius: f32(Array.from({ length: baseInitializationSize })),
  // Total particles emitted
  totalEmitted: u32(Array.from({ length: baseInitializationSize })),
} as const;

// Force component for constant forces like gravity
export const Force = {
  _name: "Force",
  torque: f32(Array.from({ length: baseInitializationSize })),
  // Constant forces (like gravity, wind)
  x: f32(Array.from({ length: baseInitializationSize })),
  y: f32(Array.from({ length: baseInitializationSize })),
} as const;

export const Gravity = {
  _name: "Gravity",
  x: f32(Array.from({ length: baseInitializationSize })),
  y: f32(Array.from({ length: baseInitializationSize })),
} as const;

export const Acceleration = {
  _name: "Acceleration",
  x: f32(Array.from({ length: baseInitializationSize })),
  y: f32(Array.from({ length: baseInitializationSize })),
} as const;

export const Named = {
  _name: "Named",
  name: Array.from<string>({ length: 100 }).fill(""),
} as const;

export const Debug = {
  _name: "Debug",
  clickedEntity: u8(Array.from({ length: baseInitializationSize })),
  frameTime: f32(Array.from({ length: baseInitializationSize })),
  hoveredEntity: u8(Array.from({ length: baseInitializationSize })),
  isPaused: u8(Array.from({ length: baseInitializationSize })),
  isSelected: u8(Array.from({ length: baseInitializationSize })),
  lastUpdated: f32(Array.from({ length: baseInitializationSize })),
  logLevel: u8(Array.from({ length: baseInitializationSize })),
  // 0=none, 1=error, 2=warn, 3=info, 4=debug
  physicsTime: f32(Array.from({ length: baseInitializationSize })),
  renderTime: f32(Array.from({ length: baseInitializationSize })),
  showBoundingBox: u8(Array.from({ length: baseInitializationSize })),
  showColliders: u8(Array.from({ length: baseInitializationSize })),
  showForceVectors: u8(Array.from({ length: baseInitializationSize })),
  showOrigin: u8(Array.from({ length: baseInitializationSize })),
  showTriggerZones: u8(Array.from({ length: baseInitializationSize })),
  showVelocityVector: u8(Array.from({ length: baseInitializationSize })),
  stepFrame: u8(Array.from({ length: baseInitializationSize })),
  systemsAffecting: Array.from<string[]>({ length: 100 }).fill([]),
  toString: Array.from<() => string>({ length: 100 }).fill(() => ""),
  updateTime: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Box component for rectangular shapes
export const Box = {
  _name: "Box",
  height: f32(Array.from({ length: baseInitializationSize })),
  isWireframe: u8(Array.from({ length: baseInitializationSize })), // 1 = wireframe, 0 = filled
  originX: f32(Array.from({ length: baseInitializationSize })), // Center point X
  originY: f32(Array.from({ length: baseInitializationSize })), // Center point Y
  rotation: f32(Array.from({ length: baseInitializationSize })), // Rotation in radians
  width: f32(Array.from({ length: baseInitializationSize })),
} as const;

// Circle component for circular shapes
export const Circle = {
  _name: "Circle",
  endAngle: f32(Array.from({ length: baseInitializationSize })), // End angle in radians
  isWireframe: u8(Array.from({ length: baseInitializationSize })), // 1 = wireframe, 0 = filled
  originX: f32(Array.from({ length: baseInitializationSize })), // Center point X
  originY: f32(Array.from({ length: baseInitializationSize })), // Center point Y
  radius: f32(Array.from({ length: baseInitializationSize })),
  segments: u8(Array.from({ length: baseInitializationSize })), // Number of segments to draw (higher = smoother)
  startAngle: f32(Array.from({ length: baseInitializationSize })), // Start angle in radians
} as const;

// Visual style component for shape rendering
export const Style = {
  _name: "Style",
  fillColor: Array.from<string>({ length: 100 }).fill("#ffffff"),
  fillOpacity: f32(Array.from({ length: baseInitializationSize })),
  strokeColor: Array.from<string>({ length: 100 }).fill("#000000"),
  strokeOpacity: f32(Array.from({ length: baseInitializationSize })),
  strokeWidth: f32(Array.from({ length: baseInitializationSize })),
} as const;
