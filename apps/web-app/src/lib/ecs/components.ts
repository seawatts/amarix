// Position component for storing entity position
export const Position = {
  x: new Float32Array(10),
  y: new Float32Array(10),
};

// Movement component for storing movement input
export const Movement = {
  dx: new Float32Array(10),
  dy: new Float32Array(10),
};

// Tag component to identify the player entity
export const Player = {
  eid: new Uint32Array(10),
};

export const CurrentPlayer = {
  eid: new Uint32Array(10),
};

// Tag component to identify NPC entities
export const NPC = {
  eid: new Uint32Array(10),
};

// Tag component to identify hostile NPCs
export const HostileNPC = {
  eid: new Uint32Array(10),
  isHostile: new Uint8Array(10),
};

// Component to store NPC interaction data
export const NPCInteraction = {
  isInteracting: new Uint8Array(10),
  message: Array.from({ length: 10 }).fill(""),
};

// Component to store interaction cooldown
export const InteractionCooldown = {
  timer: new Float32Array(10),
};

// Component to store battle state
export const BattleState = {
  enemyPosition: {
    x: new Float32Array(10),
    y: new Float32Array(10),
  },
  isActive: new Uint8Array(10),
  playerPosition: {
    x: new Float32Array(10),
    y: new Float32Array(10),
  },
  turn: new Uint8Array(10), // 0 = player turn, 1 = enemy turn
};

// Tag component to identify entities in battle
export const InBattle = {
  eid: new Uint32Array(10),
};

// Component to store health data
export const Health = {
  current: new Float32Array(10),
  max: new Float32Array(10),
};

// Component to store battle action data
export const BattleAction = {
  // "move" | "attack"
  targetX: new Float32Array(10),
  targetY: new Float32Array(10),
  type: Array.from({ length: 10 }).fill(""),
};

// Component to store valid moves/actions
export const ValidActions = {
  cells: Array.from({ length: 10 }).fill([]), // Array of {x: number, y: number}[]
};

// Input state using bit fields for multiple key tracking
export const KeyboardState = {
  // Single array to track all keys (128 possible keys)
  keys: new Uint32Array(128),
};

// Mouse state component
export const MouseState = {
  // Mouse buttons state (using bit field like keyboard)
  // Bit 0: Left button
  // Bit 1: Right button
  // Bit 2: Middle button
  buttonsDown: new Uint8Array(10),

  // Entity being clicked (0 if none)
  clickedEntity: new Uint32Array(10),

  // Entity being hovered over (0 if none)
  hoveredEntity: new Uint32Array(10),

  // Current mouse position in canvas coordinates
  x: new Float32Array(10),
  y: new Float32Array(10),
};

// BoundingBox component for collision detection and interaction areas
export const BoundingBox = {
  height: new Float32Array(10),
  width: new Float32Array(10),
} as const;

// Physics components
export const Physics = {
  accelerationX: new Float32Array(10),
  accelerationY: new Float32Array(10),
  friction: new Float32Array(10),
  isKinematic: new Int8Array(10), // 1 = physics moves it, 0 = externally controlled
  isStatic: new Int8Array(10), // 1 = immovable, 0 = movable
  mass: new Float32Array(10),
  restitution: new Float32Array(10),
  velocityX: new Float32Array(10),
  velocityY: new Float32Array(10),
} as const;

// Collision components
export const Collidable = {
  // Collision flags
  isActive: new Int8Array(10), // 1 = can collide, 0 = no collision
  isTrigger: new Int8Array(10), // 1 = trigger events only, 0 = physical collision

  // Collision layers (for filtering)
  layer: new Int32Array(10), // Which layer this entity belongs to
  mask: new Int32Array(10), // Bit mask of layers this can collide with
} as const;

// Collision manifold component - stores collision data
export const CollisionManifold = {
  // How deep the collision is
  contactPointX: new Float32Array(10),

  // Point of contact X
  contactPointY: new Float32Array(10),

  // Entity references
  entity1: new Int32Array(10),

  // First entity in collision
  entity2: new Int32Array(10),

  // Second entity in collision
  // Collision normal (direction of impact)
  normalX: new Float32Array(10),

  normalY: new Float32Array(10),
  // Collision details
  penetrationDepth: new Float32Array(10), // Point of contact Y
} as const;

// Component for trigger zones that can start quests, battles, or other events
export const TriggerZone = {
  // ID of the quest/battle/dialog to trigger
  actionId: new Uint32Array(10),

  // Cooldown time in milliseconds before trigger can be used again (if repeatable)
  cooldown: new Float32Array(10),

  // Whether this trigger has been activated
  isActivated: new Uint8Array(10),

  // Whether this trigger can be used multiple times
  isRepeatable: new Uint8Array(10),

  // Last time the trigger was activated (for cooldown)
  lastActivatedTime: new Float32Array(10),

  // Type of trigger: "quest" | "battle" | "dialog" | "checkpoint" etc.
  type: Array.from({ length: 10 }).fill(""),
} as const;

export const Hoverable = {
  isHovered: new Uint8Array(10),
  type: Array.from({ length: 10 }).fill(""),
} as const;

export const Clickable = {
  isClicked: new Uint8Array(10),
  type: Array.from({ length: 10 }).fill(""),
} as const;

// Script component to define entity behaviors
export const Script = {
  // Whether the script is active
  isActive: new Uint8Array(),
  // Function index in the script registry
  scriptId: new Float32Array(),
  // State data for the script
  state: new Float32Array(),
  // Timer for time-based scripts
  timer: new Float32Array(),
} as const;

// Sprite component for rendering images
export const Sprite = {
  // Current animation frame index
  frame: new Uint32Array(10),

  // Sprite sheet frame dimensions
  frameHeight: new Float32Array(10),

  // Current animation sequence name
  frameSequence: Array.from({ length: 10 }).fill(""),

  frameWidth: new Float32Array(10),

  // Whether the sprite is flipped horizontally
  isFlipped: new Uint8Array(10),

  // Whether the sprite is visible
  isVisible: new Uint8Array(10),

  // Sprite offset from position
  offsetX: new Float32Array(10),

  offsetY: new Float32Array(10),

  // Sprite opacity (0-1)
  opacity: new Float32Array(10),

  // Sprite rotation in radians
  rotation: new Float32Array(10),

  // Sprite scale
  scaleX: new Float32Array(10),

  scaleY: new Float32Array(10),
  // Sprite sheet source path
  src: Array.from({ length: 10 }).fill(""),
} as const;

// Animation component for sprite animations
export const Animation = {
  // Current animation sequence name
  currentSequence: Array.from({ length: 10 }).fill(""),
  // Duration of each frame in milliseconds
  frameDuration: new Float32Array(10),
  // Whether the animation should loop
  isLooping: new Uint8Array(10),
  // Whether the animation is playing
  isPlaying: new Uint8Array(10),
  // Time elapsed in current frame
  timer: new Float32Array(10),
} as const;

// Sound component for audio playback
export const Sound = {
  // Whether the sound should loop
  isLooping: new Uint8Array(10),
  // Whether the sound is playing
  isPlaying: new Uint8Array(10),
  // Maximum distance at which the sound can be heard
  maxDistance: new Float32Array(10),
  // Sound spatial position relative to listener
  panX: new Float32Array(10),
  panY: new Float32Array(10),
  // Sound playback rate (1 = normal speed)
  playbackRate: new Float32Array(10),
  // Current sound source path
  src: Array.from({ length: 10 }).fill(""),
  // Sound volume (0-1)
  volume: new Float32Array(10),
} as const;

// Scene component for managing game scenes
export const Scene = {
  // Current scene name
  current: Array.from({ length: 1 }).fill(""),
  // Scene-specific data
  data: Array.from({ length: 1 }).fill({}),
  // Whether a scene transition is in progress
  isTransitioning: new Uint8Array(1),
  // Next scene to transition to
  next: Array.from({ length: 1 }).fill(""),
  // Scene transition progress (0-1)
  transitionProgress: new Float32Array(1),
} as const;

// Particle component for visual effects
export const Particle = {
  // Current alpha/opacity (0-1)
  alpha: new Float32Array(1000),
  // Color in hex format
  color: Array.from({ length: 1000 }).fill("#ffffff"),
  // Whether the particle is active
  isActive: new Uint8Array(1000),
  // Current life of particle (0-1)
  life: new Float32Array(1000),
  // Maximum lifetime in milliseconds
  maxLife: new Float32Array(1000),
  // Size
  size: new Float32Array(1000),
  // Velocity
  velocityX: new Float32Array(1000),
  velocityY: new Float32Array(1000),
  // Position
  x: new Float32Array(1000),
  y: new Float32Array(1000),
} as const;

// ParticleEmitter component for spawning particles
export const ParticleEmitter = {
  // Emission rate (particles per second)
  emissionRate: new Float32Array(10),
  // Time since last emission
  emissionTimer: new Float32Array(10),
  // Whether the emitter is active
  isActive: new Uint8Array(10),
  // Maximum number of particles to emit (-1 for infinite)
  maxParticles: new Int32Array(10),
  // Particle configuration
  particleAlpha: new Float32Array(10),
  particleColor: Array.from({ length: 10 }).fill("#ffffff"),
  particleLife: new Float32Array(10),
  particleSize: new Float32Array(10),
  particleSpeedMax: new Float32Array(10),
  particleSpeedMin: new Float32Array(10),
  // Spawn area
  spawnRadius: new Float32Array(10),
  // Total particles emitted
  totalEmitted: new Uint32Array(10),
} as const;

// Force component for constant forces like gravity
export const Force = {
  // Constant forces (like gravity, wind)
  forceX: new Float32Array(10),
  forceY: new Float32Array(10),
} as const;
