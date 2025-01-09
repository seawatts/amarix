import { afterEach, beforeEach, vi } from "vitest";

import "@testing-library/jest-dom/vitest";

// Mock canvas context
const mockContext = {
  // Drawing methods
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  closePath: vi.fn(),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: "",
  fillText: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  strokeStyle: "",
  translate: vi.fn(),
} as unknown as CanvasRenderingContext2D;

// Mock canvas element
const getContextMock = vi.fn((contextId: string, _options?: unknown) => {
  if (contextId === "2d") return mockContext;
  return null;
});

HTMLCanvasElement.prototype.getContext =
  getContextMock as typeof HTMLCanvasElement.prototype.getContext;

// Mock requestAnimationFrame
const rAF = vi.fn((callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(performance.now()), 0) as unknown as number;
});

globalThis.requestAnimationFrame = rAF;

// Mock cancelAnimationFrame
const cAF = vi.fn((id: number): void => {
  clearTimeout(id as unknown as NodeJS.Timeout);
});

globalThis.cancelAnimationFrame = cAF;

// Mock Audio
function createClonedAudio(this: MockAudio) {
  const clone = new MockAudio();
  clone.src = this.src;
  clone.volume = this.volume;
  clone.loop = this.loop;
  clone.currentTime = this.currentTime;
  return clone;
}

class MockAudio {
  src = "";
  volume = 1;
  loop = false;
  currentTime = 0;
  readonly play = vi.fn();
  readonly pause = vi.fn();
  readonly cloneNode = vi.fn(createClonedAudio);
}

globalThis.Audio = MockAudio as unknown as typeof Audio;

// Mock performance.memory
Object.defineProperty(performance, "memory", {
  configurable: true,
  value: {
    jsHeapSizeLimit: 2_190_000_000,
    totalJSHeapSize: 21_900_000,
    usedJSHeapSize: 16_300_000,
  },
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock console methods to avoid noise in test output
// const originalConsole = { ...console };
beforeEach(() => {
  // globalThis.console.log = vi.fn();
  // globalThis.console.warn = vi.fn();
  // globalThis.console.error = vi.fn();
});

afterEach(() => {
  // globalThis.console = { ...originalConsole };
});
