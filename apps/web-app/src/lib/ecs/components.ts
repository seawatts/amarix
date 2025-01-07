/* eslint-disable unicorn/prefer-math-trunc */
// Position component for storing entity position
const baseInitializationSize = 10_000;
export const Transform = {
  _name: "Transform",
  rotation: new Float32Array(baseInitializationSize),
  scaleX: new Float32Array(baseInitializationSize),
  scaleY: new Float32Array(baseInitializationSize),
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

// Camera component for controlling view
export const Camera = {
  _name: "Camera",
  isActive: new Uint8Array(baseInitializationSize),
  isPanning: new Uint8Array(baseInitializationSize), // Whether the camera is currently being panned
  lastPanX: new Float32Array(baseInitializationSize), // Last mouse X position during pan
  lastPanY: new Float32Array(baseInitializationSize), // Last mouse Y position during pan
  maxX: new Float32Array(baseInitializationSize),
  maxY: new Float32Array(baseInitializationSize),
  minX: new Float32Array(baseInitializationSize),
  minY: new Float32Array(baseInitializationSize),
  smoothing: new Float32Array(baseInitializationSize),
  target: new Uint32Array(baseInitializationSize),
  zoom: new Float32Array(baseInitializationSize),
} as const;

export const Velocity = {
  _name: "Velocity",
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

// Movement component for storing movement input
export const Movement = {
  _name: "Movement",
  dx: new Float32Array(baseInitializationSize),
  dy: new Float32Array(baseInitializationSize),
} as const;

// Tag component to identify the player entity
export const Player = {
  _name: "Player",
  eid: new Uint32Array(baseInitializationSize),
} as const;

export const CurrentPlayer = {
  _name: "CurrentPlayer",
  eid: new Uint32Array(baseInitializationSize),
} as const;

// Tag component to identify NPC entities
export const NPC = {
  _name: "NPC",
  eid: new Uint32Array(baseInitializationSize),
} as const;

// Tag component to identify hostile NPCs
export const HostileNPC = {
  _name: "HostileNPC",
  eid: new Uint32Array(baseInitializationSize),
  isHostile: new Uint8Array(baseInitializationSize),
} as const;

// Component to store NPC interaction data
export const NPCInteraction = {
  _name: "NPCInteraction",
  isInteracting: new Uint8Array(baseInitializationSize),
  message: Array.from({ length: 100 }).fill(""),
} as const;

// Component to store interaction cooldown
export const InteractionCooldown = {
  _name: "InteractionCooldown",
  timer: new Float32Array(baseInitializationSize),
} as const;

// Component to store battle state
export const BattleState = {
  _name: "BattleState",
  enemyPosition: {
    x: new Float32Array(baseInitializationSize),
    y: new Float32Array(baseInitializationSize),
  },
  isActive: new Uint8Array(baseInitializationSize),
  playerPosition: {
    x: new Float32Array(baseInitializationSize),
    y: new Float32Array(baseInitializationSize),
  },
  turn: new Uint8Array(baseInitializationSize), // 0 = player turn, 1 = enemy turn
} as const;

// Tag component to identify entities in battle
export const InBattle = {
  _name: "InBattle",
  eid: new Uint32Array(baseInitializationSize),
} as const;

// Component to store health data
export const Health = {
  _name: "Health",
  current: new Float32Array(baseInitializationSize),
  max: new Float32Array(baseInitializationSize),
} as const;

// Component to store battle action data
export const BattleAction = {
  _name: "BattleAction",
  // "move" | "attack"
  targetX: new Float32Array(baseInitializationSize),
  targetY: new Float32Array(baseInitializationSize),
  type: Array.from({ length: 100 }).fill(""),
} as const;

// Component to store valid moves/actions
export const ValidActions = {
  _name: "ValidActions",
  cells: Array.from({ length: 100 }).fill([]), // Array of {x: number, y: number}[]
} as const;

// Input state using bit fields for multiple key tracking
export const KeyboardState = {
  _name: "KeyboardState",

  // Single array to track all keys (128 possible keys)
  keys: new Uint32Array(128),
} as const;

// Mouse state component
export const MouseState = {
  _name: "MouseState",

  // Mouse buttons state (using bit field like keyboard)
  // Bit 0: Left button
  // Bit 1: Right button
  // Bit 2: Middle button
  buttonsDown: new Uint8Array(baseInitializationSize),

  // Entity being clicked (0 if none)
  clickedEntity: new Uint32Array(baseInitializationSize),

  // Entity being hovered over (0 if none)
  hoveredEntity: new Uint32Array(baseInitializationSize),

  // Current mouse position in canvas coordinates
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

// BoundingBox component for collision detection and interaction areas
export const BoundingBox = {
  _name: "BoundingBox",
  height: new Float32Array(baseInitializationSize),
  width: new Float32Array(baseInitializationSize),
} as const;

// Polygon component for complex shapes
export const Polygon = {
  _name: "Polygon",

  // Flag for convex polygons (allows for optimization)
  isConvex: new Uint8Array(baseInitializationSize),

  // Center/origin point of the polygon
  originX: new Float32Array(baseInitializationSize),
  originY: new Float32Array(baseInitializationSize),

  // Rotation in radians
  rotation: new Float32Array(baseInitializationSize),

  // Number of vertices in the polygon
  vertexCount: new Uint32Array(baseInitializationSize),

  // Vertex coordinates stored as separate X and Y arrays for better performance
  verticesX: Array.from<Float32Array>({ length: 100 }).fill(
    new Float32Array(baseInitializationSize),
  ), // Assuming max 8 vertices per polygon
  verticesY: Array.from<Float32Array>({ length: 100 }).fill(
    new Float32Array(baseInitializationSize),
  ),
} as const;

// Physics components
export const RigidBody = {
  _name: "RigidBody",

  angularDamping: new Float32Array(baseInitializationSize),

  // reduce angular velocity over time
  angularVelocity: new Float32Array(baseInitializationSize),
  // rotation speed in rad/sec
  friction: new Float32Array(baseInitializationSize),

  isStatic: new Int8Array(baseInitializationSize),

  // 1 = immovable, 0 = movable
  linearDamping: new Float32Array(baseInitializationSize),
  // reduce linear velocity over time
  mass: new Float32Array(baseInitializationSize),
  momentOfInertia: new Float32Array(baseInitializationSize), // rotational inertia (simplified)
  restitution: new Float32Array(baseInitializationSize),
  rotation: new Float32Array(baseInitializationSize), // rotation in radians
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
  contactPointX: new Float32Array(baseInitializationSize),

  // Point of contact X
  contactPointY: new Float32Array(baseInitializationSize),

  // Entity references
  entity1: new Int32Array(baseInitializationSize),

  // First entity in collision
  entity2: new Int32Array(baseInitializationSize),

  // Second entity in collision
  // Collision normal (direction of impact)
  normalX: new Float32Array(baseInitializationSize),

  normalY: new Float32Array(baseInitializationSize),
  // Collision details
  penetrationDepth: new Float32Array(baseInitializationSize), // Point of contact Y
} as const;

// Component for trigger zones that can start quests, battles, or other events
export const TriggerZone = {
  _name: "TriggerZone",

  // ID of the quest/battle/dialog to trigger
  actionId: new Uint32Array(baseInitializationSize),

  // Cooldown time in milliseconds before trigger can be used again (if repeatable)
  cooldown: new Float32Array(baseInitializationSize),

  // Whether this trigger has been activated
  isActivated: new Uint8Array(baseInitializationSize),

  // Whether this trigger can be used multiple times
  isRepeatable: new Uint8Array(baseInitializationSize),

  // Last time the trigger was activated (for cooldown)
  lastActivatedTime: new Float32Array(baseInitializationSize),

  // Type of trigger: "quest" | "battle" | "dialog" | "checkpoint" etc.
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

export const Hoverable = {
  _name: "Hoverable",
  isHovered: new Uint8Array(baseInitializationSize),
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

export const Clickable = {
  _name: "Clickable",
  isClicked: new Uint8Array(baseInitializationSize),
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

// Script component to define entity behaviors
export const Script = {
  _name: "Script",

  // Whether the script is active
  isActive: new Uint8Array(baseInitializationSize),
  // Function index in the script registry
  scriptId: new Float32Array(baseInitializationSize),
  // State data for the script
  state: new Float32Array(baseInitializationSize),
  // Timer for time-based scripts
  timer: new Float32Array(baseInitializationSize),
} as const;

// Sprite component for rendering images
export const Sprite = {
  _name: "Sprite",

  // Current animation frame index
  frame: new Uint32Array(baseInitializationSize),

  // Sprite sheet frame dimensions
  frameHeight: new Float32Array(baseInitializationSize),

  // Current animation sequence name
  frameSequence: Array.from({ length: 100 }).fill(""),

  frameWidth: new Float32Array(baseInitializationSize),

  // Whether the sprite is flipped horizontally
  isFlipped: new Uint8Array(baseInitializationSize),

  // Whether the sprite is visible
  isVisible: new Uint8Array(baseInitializationSize),

  // Sprite offset from position
  offsetX: new Float32Array(baseInitializationSize),

  offsetY: new Float32Array(baseInitializationSize),

  // Sprite opacity (0-1)
  opacity: new Float32Array(baseInitializationSize),

  // Sprite rotation in radians
  rotation: new Float32Array(baseInitializationSize),

  // Sprite scale
  scaleX: new Float32Array(baseInitializationSize),

  scaleY: new Float32Array(baseInitializationSize),
  // Sprite sheet source path
  src: Array.from<string>({ length: 100 }).fill(""),
} as const;

// Animation component for sprite animations
export const Animation = {
  _name: "Animation",

  // Current animation sequence name
  currentSequence: Array.from({ length: 100 }).fill(""),

  // Duration of each frame in milliseconds
  frameDuration: new Float32Array(baseInitializationSize),

  // Whether the animation should loop
  isLooping: new Uint8Array(baseInitializationSize),

  // Whether the animation is playing
  isPlaying: new Uint8Array(baseInitializationSize),
  // Time elapsed in current frame
  timer: new Float32Array(baseInitializationSize),
} as const;

// Sound component for audio playback
export const Sound = {
  _name: "Sound",

  // Whether the sound should loop
  isLooping: new Uint8Array(baseInitializationSize),

  // Whether the sound is playing
  isPlaying: new Uint8Array(baseInitializationSize),

  // Maximum distance at which the sound can be heard
  maxDistance: new Float32Array(baseInitializationSize),
  // Sound spatial position relative to listener
  panX: new Float32Array(baseInitializationSize),
  panY: new Float32Array(baseInitializationSize),
  // Sound playback rate (1 = normal speed)
  playbackRate: new Float32Array(baseInitializationSize),
  // Current sound source path
  src: Array.from<string>({ length: 100 }).fill(""),
  // Sound volume (0-1)
  volume: new Float32Array(baseInitializationSize),
} as const;

// Scene component for managing game scenes
export const Scene = {
  _name: "Scene",

  // Current scene name
  current: Array.from<string>({ length: 1 }).fill(""),

  // Scene-specific data
  data: Array.from<Record<string, unknown>>({ length: 1 }).fill({}),

  // Whether a scene transition is in progress
  isTransitioning: new Uint8Array(baseInitializationSize),
  // Next scene to transition to
  next: Array.from<string>({ length: 1 }).fill(""),
  // Scene transition progress (0-1)
  transitionProgress: new Float32Array(baseInitializationSize),
} as const;

// Particle component for visual effects
export const Particle = {
  _name: "Particle",

  // Current alpha/opacity (0-1)
  alpha: new Float32Array(baseInitializationSize),

  // Color in hex format
  color: Array.from<string>({ length: 100 }).fill("#ffffff"),

  // Whether the particle is active
  isActive: new Uint8Array(baseInitializationSize),

  // Current life of particle (0-1)
  life: new Float32Array(baseInitializationSize),

  // Maximum lifetime in milliseconds
  maxLife: new Float32Array(baseInitializationSize),
  // Size
  size: new Float32Array(baseInitializationSize),
  // Velocity
  velocityX: new Float32Array(baseInitializationSize),
  velocityY: new Float32Array(baseInitializationSize),
  // Position
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

// ParticleEmitter component for spawning particles
export const ParticleEmitter = {
  _name: "ParticleEmitter",

  // Emission rate (particles per second)
  emissionRate: new Float32Array(baseInitializationSize),

  // Time since last emission
  emissionTimer: new Float32Array(baseInitializationSize),

  // Whether the emitter is active
  isActive: new Uint8Array(baseInitializationSize),

  // Maximum number of particles to emit (-1 for infinite)
  maxParticles: new Int32Array(baseInitializationSize),
  // Particle configuration
  particleAlpha: new Float32Array(baseInitializationSize),
  particleColor: Array.from<string>({ length: 100 }).fill("#ffffff"),
  particleLife: new Float32Array(baseInitializationSize),
  particleSize: new Float32Array(baseInitializationSize),
  particleSpeedMax: new Float32Array(baseInitializationSize),
  particleSpeedMin: new Float32Array(baseInitializationSize),
  // Spawn area
  spawnRadius: new Float32Array(baseInitializationSize),
  // Total particles emitted
  totalEmitted: new Uint32Array(baseInitializationSize),
} as const;

// Force component for constant forces like gravity
export const Force = {
  _name: "Force",
  torque: new Float32Array(baseInitializationSize),
  // Constant forces (like gravity, wind)
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

export const Gravity = {
  _name: "Gravity",
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

export const Acceleration = {
  _name: "Acceleration",
  x: new Float32Array(baseInitializationSize),
  y: new Float32Array(baseInitializationSize),
} as const;

export const Named = {
  _name: "Named",
  name: Array.from<string>({ length: 100 }).fill(""),
} as const;

export const Debug = {
  _name: "Debug",
  frameTime: new Float32Array(baseInitializationSize),
  isPaused: new Uint8Array(baseInitializationSize),
  isSelected: new Uint8Array(baseInitializationSize),
  lastUpdated: new Float32Array(baseInitializationSize),
  logLevel: new Uint8Array(baseInitializationSize), // 0=none, 1=error, 2=warn, 3=info, 4=debug
  physicsTime: new Float32Array(baseInitializationSize),
  renderTime: new Float32Array(baseInitializationSize),
  showBoundingBox: new Uint8Array(baseInitializationSize),
  showColliders: new Uint8Array(baseInitializationSize),
  showForceVectors: new Uint8Array(baseInitializationSize),
  showOrigin: new Uint8Array(baseInitializationSize),
  showTriggerZones: new Uint8Array(baseInitializationSize),
  showVelocityVector: new Uint8Array(baseInitializationSize),
  stepFrame: new Uint8Array(baseInitializationSize),
  systemsAffecting: Array.from<string[]>({ length: 100 }).fill([]),
  toString: Array.from<() => string>({ length: 100 }).fill(() => ""),
  updateTime: new Float32Array(baseInitializationSize),
} as const;

// Box component for rectangular shapes
export const Box = {
  _name: "Box",
  height: new Float32Array(baseInitializationSize),
  isWireframe: new Uint8Array(baseInitializationSize), // 1 = wireframe, 0 = filled
  originX: new Float32Array(baseInitializationSize), // Center point X
  originY: new Float32Array(baseInitializationSize), // Center point Y
  rotation: new Float32Array(baseInitializationSize), // Rotation in radians
  width: new Float32Array(baseInitializationSize),
} as const;

// Circle component for circular shapes
export const Circle = {
  _name: "Circle",
  endAngle: new Float32Array(baseInitializationSize), // End angle in radians
  isWireframe: new Uint8Array(baseInitializationSize), // 1 = wireframe, 0 = filled
  originX: new Float32Array(baseInitializationSize), // Center point X
  originY: new Float32Array(baseInitializationSize), // Center point Y
  radius: new Float32Array(baseInitializationSize),
  segments: new Uint8Array(baseInitializationSize), // Number of segments to draw (higher = smoother)
  startAngle: new Float32Array(baseInitializationSize), // Start angle in radians
} as const;

// Shape component to identify what type of shape an entity has
export const Shape = {
  _name: "Shape",
  // "box" | "circle" | "polygon"
  type: Array.from<string>({ length: 100 }).fill(""),
} as const;

// Visual style component for shape rendering
export const Style = {
  _name: "Style",
  fillColor: Array.from<string>({ length: 100 }).fill("#ffffff"),
  fillOpacity: new Float32Array(baseInitializationSize),
  strokeColor: Array.from<string>({ length: 100 }).fill("#000000"),
  strokeOpacity: new Float32Array(baseInitializationSize),
  strokeWidth: new Float32Array(baseInitializationSize),
} as const;
