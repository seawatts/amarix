import type { createWorld, World } from "bitecs";
import { query } from "bitecs";
import { createStore } from "zustand/vanilla";

import type { GameEngine } from "../ecs/engine";
import {
  BattleAction,
  BattleState,
  BoundingBox,
  Clickable,
  Collidable,
  CurrentPlayer,
  Health,
  HostileNPC,
  Hoverable,
  InBattle,
  InteractionCooldown,
  KeyboardState,
  MouseState,
  Movement,
  NPC,
  NPCInteraction,
  Physics,
  Player,
  Position,
  TriggerZone,
  ValidActions,
} from "~/lib/ecs/components";
import { getPressedKeys } from "~/lib/ecs/utils/keyboard";
import { getMouseState } from "~/lib/ecs/utils/mouse";

interface NPCState {
  id: number;
  position: {
    x: number;
    y: number;
  };
  isHostile: boolean;
  isInteracting: boolean;
}

interface EntityComponentState {
  position?: { x: number; y: number };
  movement?: { dx: number; dy: number };
  player?: boolean;
  currentPlayer?: boolean;
  npc?: boolean;
  hostileNpc?: { isHostile: boolean };
  npcInteraction?: {
    isInteracting: boolean;
    message: string;
  };
  interactionCooldown?: { timer: number };
  battleState?: {
    isActive: boolean;
    turn: "player" | "enemy";
    enemyPosition: { x: number; y: number };
    playerPosition: { x: number; y: number };
  };
  inBattle?: boolean;
  health?: {
    current: number;
    max: number;
  };
  battleAction?: {
    type: string;
    targetX: number;
    targetY: number;
  };
  validActions?: {
    cells: { x: number; y: number }[];
  };
  keyboardState?: {
    keys: number[];
  };
  mouseState?: {
    buttonsDown: number;
    clickedEntity: number;
    hoveredEntity: number;
    x: number;
    y: number;
  };
  hoverable?: {
    isHovered: boolean;
    type: string;
  };
  clickable?: {
    isClicked: boolean;
    type: string;
  };
  boundingBox?: {
    width: number;
    height: number;
  };
  physics?: {
    velocityX: number;
    velocityY: number;
    accelerationX: number;
    accelerationY: number;
    mass: number;
    friction: number;
    restitution: number;
  };
  collidable?: {
    isActive: boolean;
    isTrigger: boolean;
    layer: number;
    mask: number;
  };
  triggerZone?: {
    type: string;
    actionId: number;
    isActivated: boolean;
    isRepeatable: boolean;
    cooldown: number;
    lastActivatedTime: number;
  };
}

interface EntityState {
  id: number;
  components: EntityComponentState;
}

interface State {
  engine: GameEngine | null;
  metrics: GameMetrics | null;
  npcs: NPCState[];
  lastFrameTime: number;
  world: ReturnType<typeof createWorld> | null;
}

interface Actions {
  setEngine: (engine: GameEngine | null) => void;
  setWorld: (world: World | null) => void;
  update: (world: World, systemPerformance: Record<string, number>) => void;
  reset: () => void;
}

interface GameMetrics {
  entities: EntityState[];
  playerPosition: {
    gridX: number;
    gridY: number;
  };
  battle: {
    isActive: boolean;
    currentTurn: "player" | "enemy" | null;
  };
  performance: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    systems: Record<string, number>;
  };
  input: {
    pressedKeys: string[];
    mouse: {
      position: { x: number; y: number };
      buttons: {
        left: boolean;
        middle: boolean;
        right: boolean;
      };
      hoveredEntity: number;
      clickedEntity: number;
    };
  };
  componentCounts: {
    hostileNpc: number;
    inBattle: number;
    movement: number;
    npc: number;
    npcInteraction: number;
    player: number;
    position: number;
    boundingBox: number;
    physics: number;
    collidable: number;
  };
  triggerZoneCount: number;
}

export const defaultInitState: State = {
  engine: null,
  lastFrameTime: performance.now(),
  metrics: null,
  npcs: [],
  world: null,
};

export type GameStore = State & Actions;

export const createGameStore = (initState: State = defaultInitState) => {
  return createStore<GameStore>((set, get) => ({
    ...initState,
    reset: () => set(defaultInitState),
    setEngine: (engine) => set({ engine }),
    setWorld: (world) => set({ world }),
    update: (world, systemPerformance: Record<string, number> = {}) => {
      const currentTime = performance.now();
      const lastFrameTime = get().lastFrameTime;
      const frameTime = currentTime - lastFrameTime;
      const fps = 1000 / frameTime;

      // Get player metrics
      const playerEntities = query(world, [
        CurrentPlayer,
        Position,
        KeyboardState,
        MouseState,
      ]);
      const playerEid = playerEntities[0];

      let metrics: GameMetrics | null = null;

      if (playerEid) {
        const x = Position.x[playerEid] ?? 0;
        const y = Position.y[playerEid] ?? 0;

        // Get battle state
        const isActive = BattleState.isActive[playerEid] === 1;
        let currentTurn: "player" | "enemy" | null = null;
        if (isActive) {
          currentTurn = BattleState.turn[playerEid] === 0 ? "player" : "enemy";
        }

        // Get input state
        const pressedKeys = getPressedKeys(playerEid);
        const mouseState = getMouseState(playerEid);

        // Count components
        const hostileNpcEntities = query(world, [HostileNPC]).length;
        const npcEntities = query(world, [NPC]).length;
        const npcInteractionEntities = query(world, [NPCInteraction]).length;
        const positionEntities = query(world, [Position]).length;
        const playerEntitiesCount = playerEntities.length;
        const inBattleEntities = query(world, [BattleState]).length;
        const boundingBoxEntities = query(world, [BoundingBox]).length;
        const physicsEntities = query(world, [Physics]).length;
        const collidableEntities = query(world, [Collidable]).length;

        // Get all entities and their components
        const entities: EntityState[] = [];
        const allEntities = new Set([
          ...query(world, [Position]),
          ...query(world, [CurrentPlayer]),
          ...query(world, [NPC]),
          ...query(world, [HostileNPC]),
          ...query(world, [NPCInteraction]),
          ...query(world, [BattleState]),
          ...query(world, [KeyboardState]),
          ...query(world, [MouseState]),
          ...query(world, [Movement]),
          ...query(world, [Health]),
          ...query(world, [BattleAction]),
          ...query(world, [ValidActions]),
          ...query(world, [Hoverable]),
          ...query(world, [Clickable]),
          ...query(world, [Player]),
          ...query(world, [InBattle]),
          ...query(world, [InteractionCooldown]),
          ...query(world, [Physics]),
          ...query(world, [Collidable]),
          ...query(world, [TriggerZone]),
        ]);

        for (const eid of allEntities) {
          const components: EntityComponentState = {};
          let hasComponents = false;

          // Position
          if (Position.x[eid] !== undefined && Position.y[eid] !== undefined) {
            hasComponents = true;
            components.position = {
              x: Position.x[eid] ?? 0,
              y: Position.y[eid] ?? 0,
            };
          }

          // Movement
          if (
            Movement.dx[eid] !== undefined &&
            Movement.dy[eid] !== undefined
          ) {
            hasComponents = true;
            components.movement = {
              dx: Movement.dx[eid] ?? 0,
              dy: Movement.dy[eid] ?? 0,
            };
          }

          // Player
          if (Player.eid[eid] !== undefined) {
            hasComponents = true;
            components.player = true;
          }

          // Current Player
          if (CurrentPlayer.eid[eid] !== undefined) {
            hasComponents = true;
            components.currentPlayer = true;
          }

          // NPC
          if (NPC.eid[eid] !== undefined) {
            hasComponents = true;
            components.npc = true;
          }

          // Hostile NPC
          if (
            HostileNPC.eid[eid] !== undefined &&
            HostileNPC.isHostile[eid] !== undefined
          ) {
            hasComponents = true;
            components.hostileNpc = {
              isHostile: HostileNPC.isHostile[eid] === 1,
            };
          }

          // NPC Interaction
          if (
            NPCInteraction.isInteracting[eid] !== undefined &&
            NPCInteraction.message[eid] !== undefined
          ) {
            const message = NPCInteraction.message[eid];
            hasComponents = true;
            components.npcInteraction = {
              isInteracting: NPCInteraction.isInteracting[eid] === 1,
              message: typeof message === "string" ? message : "",
            };
          }

          // Interaction Cooldown
          if (InteractionCooldown.timer[eid] !== undefined) {
            hasComponents = true;
            components.interactionCooldown = {
              timer: InteractionCooldown.timer[eid] ?? 0,
            };
          }

          // Battle State
          if (
            BattleState.isActive[eid] !== undefined &&
            BattleState.turn[eid] !== undefined &&
            BattleState.enemyPosition.x[eid] !== undefined &&
            BattleState.enemyPosition.y[eid] !== undefined &&
            BattleState.playerPosition.x[eid] !== undefined &&
            BattleState.playerPosition.y[eid] !== undefined
          ) {
            hasComponents = true;
            components.battleState = {
              enemyPosition: {
                x: BattleState.enemyPosition.x[eid] ?? 0,
                y: BattleState.enemyPosition.y[eid] ?? 0,
              },
              isActive: BattleState.isActive[eid] === 1,
              playerPosition: {
                x: BattleState.playerPosition.x[eid] ?? 0,
                y: BattleState.playerPosition.y[eid] ?? 0,
              },
              turn: BattleState.turn[eid] === 0 ? "player" : "enemy",
            };
          }

          // In Battle
          if (InBattle.eid[eid] !== undefined) {
            hasComponents = true;
            components.inBattle = true;
          }

          // Health
          if (
            Health.current[eid] !== undefined &&
            Health.max[eid] !== undefined
          ) {
            hasComponents = true;
            components.health = {
              current: Health.current[eid] ?? 0,
              max: Health.max[eid] ?? 0,
            };
          }

          // Battle Action
          if (
            BattleAction.type[eid] !== undefined &&
            BattleAction.targetX[eid] !== undefined &&
            BattleAction.targetY[eid] !== undefined
          ) {
            const type = BattleAction.type[eid];
            hasComponents = true;
            components.battleAction = {
              targetX: BattleAction.targetX[eid] ?? 0,
              targetY: BattleAction.targetY[eid] ?? 0,
              type: typeof type === "string" ? type : "",
            };
          }

          // Valid Actions
          if (ValidActions.cells[eid] !== undefined) {
            const cells = ValidActions.cells[eid];
            if (Array.isArray(cells)) {
              const validCells = cells.filter(
                (cell): cell is { x: number; y: number } =>
                  cell !== null &&
                  typeof cell === "object" &&
                  typeof (cell as { x: number; y: number }).x === "number" &&
                  typeof (cell as { x: number; y: number }).y === "number",
              );

              if (validCells.length > 0) {
                hasComponents = true;
                components.validActions = {
                  cells: validCells.filter(
                    (cell): cell is { x: number; y: number } =>
                      cell !== null &&
                      typeof cell === "object" &&
                      typeof (cell as { x: number; y: number }).x ===
                        "number" &&
                      typeof (cell as { x: number; y: number }).y === "number",
                  ),
                };
              }
            }
          }

          // Keyboard State
          if (KeyboardState.keys[eid] !== undefined) {
            hasComponents = true;
            components.keyboardState = {
              keys: [...KeyboardState.keys],
            };
          }

          // Mouse State
          if (
            MouseState.x[eid] !== undefined &&
            MouseState.y[eid] !== undefined &&
            MouseState.buttonsDown[eid] !== undefined &&
            MouseState.clickedEntity[eid] !== undefined &&
            MouseState.hoveredEntity[eid] !== undefined
          ) {
            hasComponents = true;
            components.mouseState = {
              buttonsDown: MouseState.buttonsDown[eid] ?? 0,
              clickedEntity: MouseState.clickedEntity[eid] ?? 0,
              hoveredEntity: MouseState.hoveredEntity[eid] ?? 0,
              x: MouseState.x[eid] ?? 0,
              y: MouseState.y[eid] ?? 0,
            };
          }

          // Hoverable
          if (
            Hoverable.type[eid] !== undefined &&
            Hoverable.isHovered[eid] !== undefined
          ) {
            const type = Hoverable.type[eid];
            hasComponents = true;
            components.hoverable = {
              isHovered: Hoverable.isHovered[eid] === 1,
              type: typeof type === "string" ? type : "",
            };
          }

          // Clickable
          if (
            Clickable.type[eid] !== undefined &&
            Clickable.isClicked[eid] !== undefined
          ) {
            const type = Clickable.type[eid];
            hasComponents = true;
            components.clickable = {
              isClicked: Clickable.isClicked[eid] === 1,
              type: typeof type === "string" ? type : "",
            };
          }

          // Bounding Box
          if (
            BoundingBox.width[eid] !== undefined &&
            BoundingBox.height[eid] !== undefined
          ) {
            hasComponents = true;
            components.boundingBox = {
              height: BoundingBox.height[eid] ?? 0,
              width: BoundingBox.width[eid] ?? 0,
            };
          }

          // Physics
          if (
            Physics.velocityX[eid] !== undefined &&
            Physics.velocityY[eid] !== undefined &&
            Physics.accelerationX[eid] !== undefined &&
            Physics.accelerationY[eid] !== undefined &&
            Physics.mass[eid] !== undefined &&
            Physics.friction[eid] !== undefined &&
            Physics.restitution[eid] !== undefined
          ) {
            hasComponents = true;
            components.physics = {
              accelerationX: Physics.accelerationX[eid] ?? 0,
              accelerationY: Physics.accelerationY[eid] ?? 0,
              elasticity: Physics.restitution[eid] ?? 0.5,
              friction: Physics.friction[eid] ?? 0.1,
              mass: Physics.mass[eid] ?? 1,
              velocityX: Physics.velocityX[eid] ?? 0,
              velocityY: Physics.velocityY[eid] ?? 0,
            };
          }

          // Collidable
          if (
            Collidable.isActive[eid] !== undefined &&
            Collidable.isTrigger[eid] !== undefined &&
            Collidable.layer[eid] !== undefined &&
            Collidable.mask[eid] !== undefined
          ) {
            hasComponents = true;
            components.collidable = {
              isActive: Collidable.isActive[eid] === 1,
              isTrigger: Collidable.isTrigger[eid] === 1,
              layer: Collidable.layer[eid] ?? 0,
              mask: Collidable.mask[eid] ?? 0xff_ff_ff_ff,
            };
          }

          // Trigger Zone
          if (
            TriggerZone.type[eid] !== undefined &&
            TriggerZone.actionId[eid] !== undefined &&
            TriggerZone.isActivated[eid] !== undefined &&
            TriggerZone.isRepeatable[eid] !== undefined &&
            TriggerZone.cooldown[eid] !== undefined &&
            TriggerZone.lastActivatedTime[eid] !== undefined
          ) {
            hasComponents = true;
            // components.triggerZone = {
            //   actionId: TriggerZone.actionId[eid] ?? 0,
            //   cooldown: TriggerZone.cooldown[eid] ?? 0,
            //   isActivated: TriggerZone.isActivated[eid] === 1,
            //   isRepeatable: TriggerZone.isRepeatable[eid] === 1,
            //   lastActivatedTime: TriggerZone.lastActivatedTime[eid] ?? 0,
            //   type: TriggerZone.type[eid] ?? "",
            // };
          }

          // Only add entities that have at least one component
          if (hasComponents) {
            entities.push({ components, id: eid });
          }
        }

        metrics = {
          battle: {
            currentTurn,
            isActive,
          },
          componentCounts: {
            boundingBox: boundingBoxEntities,
            collidable: collidableEntities,
            hostileNpc: hostileNpcEntities,
            inBattle: inBattleEntities,
            movement: positionEntities,
            npc: npcEntities,
            npcInteraction: npcInteractionEntities,
            physics: physicsEntities,
            player: playerEntitiesCount,
            position: positionEntities,
          },
          entities,
          input: {
            mouse: mouseState,
            pressedKeys,
          },
          performance: {
            fps,
            frameTime,
            memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
            systems: {
              ...systemPerformance,
              GameState: performance.now() - currentTime,
            },
          },
          playerPosition: {
            gridX: Math.round(x / 50),
            gridY: Math.round(y / 50),
          },
          triggerZoneCount: query(world, [TriggerZone]).length,
        };
      }

      // Get NPC states
      const npcs: NPCState[] = [];
      const npcEntities = query(world, [NPC, Position]);

      for (const eid of npcEntities) {
        npcs.push({
          id: eid,
          isHostile: HostileNPC.isHostile[eid] === 1,
          isInteracting: NPCInteraction.isInteracting[eid] === 1,
          position: {
            x: Position.x[eid] ?? 0,
            y: Position.y[eid] ?? 0,
          },
        });
      }

      set({ lastFrameTime: currentTime, metrics, npcs });
    },
  }));
};
