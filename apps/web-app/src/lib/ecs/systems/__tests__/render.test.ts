import { addComponent, addEntity, createWorld } from "bitecs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldProps } from "../../types";
import type { RenderContext, RenderLayer } from "../render/types";
import { Camera, Transform } from "../../components";
import { createRenderSystem } from "../render";
import { Renderer } from "../render/renderer";
import { RENDER_LAYERS } from "../render/types";

describe("Render System", () => {
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let mockContext: {
    clearRect: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    rotate: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    scale: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>;
    fillRect: ReturnType<typeof vi.fn>;
    strokeRect: ReturnType<typeof vi.fn>;
    beginPath: ReturnType<typeof vi.fn>;
    closePath: ReturnType<typeof vi.fn>;
    arc: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
    fillText: ReturnType<typeof vi.fn>;
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    globalAlpha: number;
    setTransform: ReturnType<typeof vi.fn>;
    transform: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    font: string;
    textBaseline: CanvasTextBaseline;
  };
  let renderer: Renderer;

  beforeEach(() => {
    // Create canvas and mock context
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    mockContext = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      closePath: vi.fn(),
      drawImage: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "black",
      fillText: vi.fn(),
      font: "14px monospace",
      globalAlpha: 1,
      lineTo: vi.fn(),
      lineWidth: 1,
      moveTo: vi.fn(),
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      strokeStyle: "black",
      textBaseline: "top",
      transform: vi.fn(),
      translate: vi.fn(),
    };

    context = mockContext as unknown as CanvasRenderingContext2D;

    // Mock getContext with proper type overloads
    const getContextMock = vi.fn(
      (_contextId: "2d", _options?: CanvasRenderingContext2DSettings) =>
        context,
    );
    canvas.getContext =
      getContextMock as unknown as HTMLCanvasElement["getContext"];
    renderer = new Renderer();
  });

  it("should handle camera transformations correctly", () => {
    const world = createWorld<WorldProps>();
    const cameraEid = addEntity(world);

    // Set up camera entity
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Transform.x[cameraEid] = 100;
    Transform.y[cameraEid] = 200;
    Transform.scaleX[cameraEid] = 2;
    Transform.rotation[cameraEid] = Math.PI / 4;

    const renderSystem = createRenderSystem(canvas);
    renderSystem(world);

    // Verify camera transformations were applied in correct order
    // 1. Move to center of viewport
    expect(mockContext.translate).toHaveBeenCalledWith(400, 300);

    // 2. Apply zoom
    expect(mockContext.scale).toHaveBeenCalledWith(2, 2);

    // 3. Apply rotation
    expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 4);

    // 4. Move world opposite to camera position
    expect(mockContext.translate).toHaveBeenCalledWith(-100, -200);
  });

  it("should follow target entity when specified", () => {
    const world = createWorld<WorldProps>();
    const cameraEid = addEntity(world);
    const targetEid = addEntity(world);

    // Set up camera entity with target
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Camera.target[cameraEid] = targetEid;

    // Set up target entity
    addComponent(world, targetEid, Transform);
    Transform.x[targetEid] = 300;
    Transform.y[targetEid] = 400;

    const renderSystem = createRenderSystem(canvas);
    renderSystem(world);

    // Verify camera follows target position
    expect(mockContext.translate).toHaveBeenCalledWith(-300, -400);
  });

  it("should render layers in correct order", () => {
    const world = createWorld<WorldProps>();
    const renderOrder: string[] = [];

    // Create mock layers
    const createMockLayer = (name: string, order: number): RenderLayer => ({
      ignoreCamera: false,
      name,
      order,
      render: () => {
        renderOrder.push(name);
      },
    });

    const backgroundLayer = createMockLayer(
      "background",
      RENDER_LAYERS.BACKGROUND,
    );
    const entitiesLayer = createMockLayer("entities", RENDER_LAYERS.ENTITIES);
    const particlesLayer = createMockLayer(
      "particles",
      RENDER_LAYERS.PARTICLES,
    );
    const spritesLayer = createMockLayer("sprites", RENDER_LAYERS.SPRITES);
    const debugLayer = createMockLayer("debug", RENDER_LAYERS.DEBUG);

    // Add layers in random order
    renderer.addLayer(debugLayer);
    renderer.addLayer(entitiesLayer);
    renderer.addLayer(backgroundLayer);
    renderer.addLayer(spritesLayer);
    renderer.addLayer(particlesLayer);

    // Create render context
    const renderContext: RenderContext = {
      camera: { rotation: 0, x: 0, y: 0, zoom: 1 },
      canvas,
      ctx: context,
      world,
    };

    renderer.render(renderContext);

    // Verify layers were rendered in correct order
    expect(renderOrder).toEqual([
      "background",
      "entities",
      "particles",
      "sprites",
      "debug",
    ]);
  });

  it("should respect ignoreCamera flag for UI layers", () => {
    const world = createWorld<WorldProps>();
    const cameraEid = addEntity(world);

    // Set up camera
    addComponent(world, cameraEid, Camera);
    addComponent(world, cameraEid, Transform);
    Camera.isActive[cameraEid] = 1;
    Transform.x[cameraEid] = 100;
    Transform.y[cameraEid] = 200;

    // Create mock UI layer that ignores camera
    const uiLayer: RenderLayer = {
      ignoreCamera: true,
      name: "ui",
      order: RENDER_LAYERS.UI,
      render: (_context: RenderContext) => {
        // UI rendering logic
      },
    };

    renderer.addLayer(uiLayer);

    // Create render context
    const renderContext: RenderContext = {
      camera: { rotation: 0, x: 100, y: 200, zoom: 1 },
      canvas,
      ctx: context,
      world,
    };

    renderer.render(renderContext);

    // Verify that save/restore was called for the layer
    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.restore).toHaveBeenCalled();

    // Verify that camera transform was not applied for UI layer
    const translateCalls = mockContext.translate.mock.calls;
    expect(translateCalls).not.toContainEqual([-100, -200]);
  });

  it("should clear canvas before rendering", () => {
    const world = createWorld<WorldProps>();

    // Create render context
    const renderContext: RenderContext = {
      camera: { rotation: 0, x: 0, y: 0, zoom: 1 },
      canvas,
      ctx: context,
      world,
    };

    renderer.render(renderContext);

    // Verify canvas was cleared
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it("should use first active camera only", () => {
    const world = createWorld<WorldProps>();
    const camera1Eid = addEntity(world);
    const camera2Eid = addEntity(world);

    // Set up first camera
    addComponent(world, camera1Eid, Camera);
    addComponent(world, camera1Eid, Transform);
    Camera.isActive[camera1Eid] = 1;
    Transform.x[camera1Eid] = 100;
    Transform.y[camera1Eid] = 200;

    // Set up second camera
    addComponent(world, camera2Eid, Camera);
    addComponent(world, camera2Eid, Transform);
    Camera.isActive[camera2Eid] = 1;
    Transform.x[camera2Eid] = 300;
    Transform.y[camera2Eid] = 400;

    const renderSystem = createRenderSystem(canvas);
    renderSystem(world);

    // Verify only first camera's transform was applied
    // First translate to center
    expect(mockContext.translate).toHaveBeenCalledWith(400, 300);
    // Then translate by camera position
    expect(mockContext.translate).toHaveBeenCalledWith(-100, -200);
    // Second camera's position should not be used
    expect(mockContext.translate).not.toHaveBeenCalledWith(-300, -400);
  });
});
