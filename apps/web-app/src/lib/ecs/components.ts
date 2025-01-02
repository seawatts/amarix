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

// Physics component for handling velocity, acceleration, and other physics properties
export const Physics = {
  // Acceleration in pixels per second squared
  accelerationX: new Float32Array(10),
  accelerationY: new Float32Array(10),
  // Elasticity for bouncing (0.0 to 1.0, default 0.5)
  elasticity: new Float32Array(10),
  // Friction coefficient (0.0 to 1.0, default 0.1)
  friction: new Float32Array(10),
  // Mass for physics calculations (default 1.0)
  mass: new Float32Array(10),
  // Velocity in pixels per second
  velocityX: new Float32Array(10),
  velocityY: new Float32Array(10),
} as const;

// Component to mark entities that can collide and how they should respond
export const Collidable = {
  // Whether this object is static (immovable) or dynamic
  isStatic: new Uint8Array(10),

  // Layer mask for filtering collisions (e.g., player can collide with walls but not other players)
  layer: new Uint8Array(10),

  // Type of collision response: "solid" | "trigger" | "bounce"
  type: Array.from({ length: 10 }).fill(""),
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
