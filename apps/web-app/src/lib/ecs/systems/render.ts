import type { World } from "bitecs";
import { query } from "bitecs";

import {
  BoundingBox,
  Clickable,
  CurrentPlayer,
  Health,
  HostileNPC,
  Hoverable,
  NPC,
  Player,
  Position,
} from "../components";

const CELL_SIZE = 100;
const HEALTH_BAR_HEIGHT = 8;
const HEALTH_BAR_OFFSET = 10;

function renderHealthBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  currentHealth: number,
  maxHealth: number,
) {
  const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth));

  // Background with better contrast
  context.fillStyle = "#4a0f0f";
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width - 4,
    HEALTH_BAR_HEIGHT,
  );

  // Health with more vibrant color
  context.fillStyle = "#00ff66";
  context.fillRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    (width - 4) * healthPercentage,
    HEALTH_BAR_HEIGHT,
  );

  // Add border for better visibility
  context.strokeStyle = "#ffffff33";
  context.strokeRect(
    x + 2,
    y - HEALTH_BAR_OFFSET - HEALTH_BAR_HEIGHT,
    width - 4,
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

  return function renderSystem(world: World) {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

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

    // Query for entities with Position, BoundingBox, and other components
    const npcs = query(world, [Position, NPC, BoundingBox]);
    const hostileNpcs = query(world, [Position, HostileNPC]);
    const players = query(world, [
      Position,
      Player,
      CurrentPlayer,
      BoundingBox,
    ]);

    // Draw NPCs first (so player appears on top)
    for (const eid of npcs) {
      const x = Position.x[eid] ?? 0;
      const y = Position.y[eid] ?? 0;
      const width = BoundingBox.width[eid] ?? 0;
      const height = BoundingBox.height[eid] ?? 0;
      const isHostile = hostileNpcs.includes(eid);
      const isHovered = Hoverable.isHovered[eid] === 1;
      const isClicked = Clickable.isClicked[eid] === 1;

      // Set NPC color and glow
      context.fillStyle = isHostile ? "#ff4d4d" : "#4d94ff";
      context.shadowColor = isHostile ? "#ff000066" : "#0066ff66";
      context.shadowBlur = isHovered ? 25 : 15;

      // Draw centered on position
      context.fillRect(x - width / 2, y - height / 2, width, height);

      // Reset shadow
      context.shadowBlur = 0;

      // Add border for better definition
      context.strokeStyle = isHovered || isClicked ? "#ffffff" : "#ffffff66";
      context.lineWidth = isHovered || isClicked ? 3 : 2;
      context.strokeRect(x - width / 2, y - height / 2, width, height);

      // Draw health bar
      const health = Health.current[eid] ?? 0;
      const maxHealth = Health.max[eid] ?? 0;
      renderHealthBar(
        context,
        x - width / 2,
        y - height / 2,
        width,
        health,
        maxHealth,
      );

      // Show cursor pointer when hovering
      if (isHovered) {
        context.canvas.style.cursor = "pointer";
      }
    }

    // Draw player
    for (const eid of players) {
      const x = Position.x[eid] ?? 0;
      const y = Position.y[eid] ?? 0;
      const width = BoundingBox.width[eid] ?? 0;
      const height = BoundingBox.height[eid] ?? 0;

      // Draw player with more vibrant color
      context.fillStyle = "#00ff88";

      // Add player glow effect
      context.shadowColor = "#00ff8866";
      context.shadowBlur = 20;

      // Draw centered on position
      context.fillRect(x - width / 2, y - height / 2, width, height);

      // Reset shadow
      context.shadowBlur = 0;

      // Add border for better definition
      context.strokeStyle = "#ffffff66";
      context.lineWidth = 2;
      context.strokeRect(x - width / 2, y - height / 2, width, height);

      // Draw health bar
      const health = Health.current[eid] ?? 0;
      const maxHealth = Health.max[eid] ?? 0;
      renderHealthBar(
        context,
        x - width / 2,
        y - height / 2,
        width,
        health,
        maxHealth,
      );
    }

    return world;
  };
}
