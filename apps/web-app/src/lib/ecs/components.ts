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

// Tag component to identify NPC entities
export const NPC = {
  eid: new Uint32Array(10),
};

// Tag component to identify hostile NPCs
export const HostileNPC = {
  eid: new Uint32Array(10),
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

export const InputState = {
  pressedKeys: new Set<string>(),
};

// Debug Metrics Component
export const DebugMetrics = {
  componentCounts: {
    hostileNpc: new Uint32Array(10),
    inBattle: new Uint32Array(10),
    movement: new Uint32Array(10),
    npc: new Uint32Array(10),
    npcInteraction: new Uint32Array(10),
    player: new Uint32Array(10),
    position: new Uint32Array(10),
  },
  fps: new Uint32Array(10),
  frameTime: new Float32Array(10),
  lastUpdate: new Float64Array(10),
  memoryUsage: new Float64Array(10),
};

// Component to track clickable entities and hover state
export const Clickable = {
  isHovered: new Uint8Array(10),
};
