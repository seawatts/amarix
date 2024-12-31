import type { createWorld } from "bitecs";
import { query } from "bitecs";

import {
  BattleState,
  Health,
  HostileNPC,
  InBattle,
  NPC,
  Player,
  Position,
  ValidActions,
} from "../components";

const CELL_SIZE = 100;
const BATTLE_GRID_SIZE = 10;
const HEALTH_BAR_HEIGHT = 8;
const HEALTH_BAR_OFFSET = 10;

interface ValidMove {
  x: number;
  y: number;
}

function renderHealthBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  currentHealth: number,
  maxHealth: number,
) {
  const width = CELL_SIZE - 4;
  const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth));

  // Background with better contrast
  context.fillStyle = "#4a0f0f";
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width,
    HEALTH_BAR_HEIGHT,
  );

  // Health with more vibrant color
  context.fillStyle = "#00ff66";
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width * healthPercentage,
    HEALTH_BAR_HEIGHT,
  );

  // Add border for better visibility
  context.strokeStyle = "#ffffff33";
  context.strokeRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width,
    HEALTH_BAR_HEIGHT,
  );
}

export function createRenderSystem(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  // Create and cache noise pattern
  const noiseCanvas = document.createElement("canvas");
  const noiseContext = noiseCanvas.getContext("2d");
  if (!noiseContext) {
    throw new Error("Could not get noise canvas context");
  }
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;

  // Generate noise pattern once
  noiseContext.globalAlpha = 0.03;
  for (let x = 0; x < noiseCanvas.width; x += 4) {
    for (let y = 0; y < noiseCanvas.height; y += 4) {
      if (Math.random() > 0.5) {
        noiseContext.fillStyle = "#ffffff";
        noiseContext.fillRect(x, y, 2, 2);
      }
    }
  }

  // Cache the noise pattern
  const noisePattern = context.createPattern(noiseCanvas, "repeat");

  // Cache the background gradient
  const backgroundGradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) / 1.5,
  );
  backgroundGradient.addColorStop(0, "#1a1c2c");
  backgroundGradient.addColorStop(1, "#0f111a");

  // Cache vertical and horizontal gradients for grid lines
  const verticalGradients: CanvasGradient[] = [];
  const horizontalGradients: CanvasGradient[] = [];

  for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
    const gradient = context.createLinearGradient(x, 0, x, canvas.height);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    verticalGradients.push(gradient);
  }

  for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
    const gradient = context.createLinearGradient(0, y, canvas.width, y);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    horizontalGradients.push(gradient);
  }

  return (world: ReturnType<typeof createWorld>) => {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    const battling = query(world, [InBattle]);

    if (battling.length > 0) {
      // Render battle mode
      renderBattleGrid(context, canvas);
      renderBattleEntities(world, context);
    } else {
      // Render exploration mode
      renderExplorationGrid(
        context,
        canvas,
        backgroundGradient,
        noisePattern,
        verticalGradients,
        horizontalGradients,
      );
      renderExplorationEntities(world, context);
    }

    return world;
  };
}

function renderBattleGrid(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
) {
  // Calculate grid offset to center it
  const gridWidth = BATTLE_GRID_SIZE * CELL_SIZE;
  const gridHeight = BATTLE_GRID_SIZE * CELL_SIZE;
  const offsetX = (canvas.width - gridWidth) / 2;
  const offsetY = (canvas.height - gridHeight) / 2;

  // Draw battle grid
  context.strokeStyle = "#666";
  context.lineWidth = 1;

  for (let x = 0; x <= BATTLE_GRID_SIZE; x++) {
    context.beginPath();
    context.moveTo(offsetX + x * CELL_SIZE, offsetY);
    context.lineTo(offsetX + x * CELL_SIZE, offsetY + gridHeight);
    context.stroke();
  }

  for (let y = 0; y <= BATTLE_GRID_SIZE; y++) {
    context.beginPath();
    context.moveTo(offsetX, offsetY + y * CELL_SIZE);
    context.lineTo(offsetX + gridWidth, offsetY + y * CELL_SIZE);
    context.stroke();
  }

  // Draw border
  context.strokeStyle = "#333";
  context.lineWidth = 2;
  context.strokeRect(offsetX, offsetY, gridWidth, gridHeight);
}

function renderBattleEntities(
  world: ReturnType<typeof createWorld>,
  context: CanvasRenderingContext2D,
) {
  const players = query(world, [Player, InBattle]);
  const enemies = query(world, [HostileNPC, InBattle]);

  for (const playerEid of players) {
    // Draw valid moves
    const validMoves = (ValidActions.cells[playerEid] ?? []) as ValidMove[];
    for (const move of validMoves) {
      context.fillStyle = "rgba(255, 255, 0, 0.3)";
      context.fillRect(move.x, move.y, CELL_SIZE - 2, CELL_SIZE - 2);
    }

    // Draw player
    const x = BattleState.playerPosition.x[playerEid] ?? 0;
    const y = BattleState.playerPosition.y[playerEid] ?? 0;
    context.fillStyle = "#4CAF50";
    context.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);

    // Draw player health bar
    const playerHealth = Health.current[playerEid] ?? 0;
    const playerMaxHealth = Health.max[playerEid] ?? 100;
    renderHealthBar(context, x, y, playerHealth, playerMaxHealth);
  }

  for (const enemyEid of enemies) {
    // Draw enemy
    const x = BattleState.enemyPosition.x[enemyEid] ?? 0;
    const y = BattleState.enemyPosition.y[enemyEid] ?? 0;
    context.fillStyle = "#f44336";
    context.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);

    // Draw enemy health bar
    const enemyHealth = Health.current[enemyEid] ?? 0;
    const enemyMaxHealth = Health.max[enemyEid] ?? 100;
    renderHealthBar(context, x, y, enemyHealth, enemyMaxHealth);
  }
}

function renderExplorationGrid(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  backgroundGradient: CanvasGradient,
  noisePattern: CanvasPattern | null,
  verticalGradients: CanvasGradient[],
  horizontalGradients: CanvasGradient[],
) {
  // Fill background
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw pre-rendered noise pattern
  if (noisePattern) {
    context.fillStyle = noisePattern;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw grid lines with better visibility
  context.lineWidth = 2;

  // Draw vertical lines with fade effect
  let gradientIndex = 0;
  for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
    const gradient = verticalGradients[gradientIndex];
    if (gradient) {
      context.beginPath();
      context.strokeStyle = gradient;
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    gradientIndex = (gradientIndex + 1) % verticalGradients.length;
  }

  // Draw horizontal lines with fade effect
  gradientIndex = 0;
  for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
    const gradient = horizontalGradients[gradientIndex];
    if (gradient) {
      context.beginPath();
      context.strokeStyle = gradient;
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    gradientIndex = (gradientIndex + 1) % horizontalGradients.length;
  }
}

function renderExplorationEntities(
  world: ReturnType<typeof createWorld>,
  context: CanvasRenderingContext2D,
) {
  const npcs = query(world, [Position, NPC]);
  const players = query(world, [Position, Player]);
  // console.log("[Render] players", players);

  // Render NPCs first (so player appears on top)
  for (const npcEid of npcs) {
    const x = Position.x[npcEid] ?? 0;
    const y = Position.y[npcEid] ?? 0;

    context.fillStyle = HostileNPC.eid[npcEid] ? "#ff4d4d" : "#4d94ff";

    // Add entity glow effect
    context.shadowColor = HostileNPC.eid[npcEid] ? "#ff000066" : "#0066ff66";
    context.shadowBlur = 15;

    // Draw centered on grid
    context.fillRect(
      x - CELL_SIZE / 2,
      y - CELL_SIZE / 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
    );

    // Reset shadow
    context.shadowBlur = 0;

    // Add border for better definition
    context.strokeStyle = "#ffffff66";
    context.lineWidth = 2;
    context.strokeRect(
      x - CELL_SIZE / 2,
      y - CELL_SIZE / 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
    );

    if (Health.current[npcEid] !== undefined) {
      const npcHealth = Health.current[npcEid] ?? 0;
      const npcMaxHealth = Health.max[npcEid] ?? 100;
      renderHealthBar(
        context,
        x - CELL_SIZE / 2,
        y - CELL_SIZE / 2,
        npcHealth,
        npcMaxHealth,
      );
    }
  }

  // Render player
  for (const playerEid of players) {
    const x = Position.x[playerEid] ?? 0;
    const y = Position.y[playerEid] ?? 0;

    // Draw player with more vibrant color
    context.fillStyle = "#00ff88";

    // Add player glow effect
    context.shadowColor = "#00ff8866";
    context.shadowBlur = 20;

    // Draw centered on grid
    context.fillRect(
      x - CELL_SIZE / 2,
      y - CELL_SIZE / 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
    );

    // Reset shadow
    context.shadowBlur = 0;

    // Add border for better definition
    context.strokeStyle = "#ffffff66";
    context.lineWidth = 2;
    context.strokeRect(
      x - CELL_SIZE / 2,
      y - CELL_SIZE / 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
    );

    if (Health.current[playerEid] !== undefined) {
      const playerHealth = Health.current[playerEid] ?? 0;
      const playerMaxHealth = Health.max[playerEid] ?? 100;
      renderHealthBar(
        context,
        x - CELL_SIZE / 2,
        y - CELL_SIZE / 2,
        playerHealth,
        playerMaxHealth,
      );
    }
  }
}
