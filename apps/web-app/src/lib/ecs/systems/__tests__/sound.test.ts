import { addComponent, addEntity, createWorld } from "bitecs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sound, Transform } from "../../components";
import { createSoundSystem } from "../sound";

interface MockAudio {
  addEventListener: (event: string, callback: (error?: Error) => void) => void;
  cloneNode: () => MockAudio;
  currentTime: number;
  load: () => void;
  loop: boolean;
  pause: () => void;
  play: () => Promise<void>;
  playbackRate: number;
  src: string;
  volume: number;
}

describe.skip("Sound System", () => {
  let mockAudio: MockAudio;

  beforeEach(() => {
    // Create mock audio
    mockAudio = {
      addEventListener: vi.fn((event, callback) => {
        if (event === "canplaythrough") {
          // Simulate async audio load
          setTimeout(() => callback(), 0);
        }
      }),
      cloneNode: vi.fn(() => ({ ...mockAudio })),
      currentTime: 0,
      load: vi.fn(),
      loop: false,
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      playbackRate: 1,
      src: "",
      volume: 1,
    };

    // Mock Audio constructor
    vi.stubGlobal(
      "Audio",
      vi.fn(() => mockAudio),
    );
  });

  it("should load new sounds", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up sound entity
    addComponent(world, eid, Sound);
    Sound.src[eid] = "/test-sound.mp3";

    const soundSystem = createSoundSystem();
    soundSystem(world);

    // Verify sound loading was initiated
    expect(vi.mocked(globalThis.Audio)).toHaveBeenCalled();
    expect(mockAudio.src).toBe("/test-sound.mp3");
    expect(mockAudio.load).toHaveBeenCalled();
  });

  it("should play and stop sounds", async () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up sound entity
    addComponent(world, eid, Sound);
    Sound.src[eid] = "/test-sound.mp3";
    Sound.isPlaying[eid] = 0;
    Sound.volume[eid] = 0.5;
    Sound.playbackRate[eid] = 1.5;

    const soundSystem = createSoundSystem();

    // Wait for sound to "load"
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Start playing
    Sound.isPlaying[eid] = 1;
    soundSystem(world);

    // Verify sound started playing with correct parameters
    expect(mockAudio.cloneNode).toHaveBeenCalled();
    const playingAudio = mockAudio.cloneNode();
    expect(playingAudio.play).toHaveBeenCalled();
    expect(playingAudio.volume).toBe(0.5);
    expect(playingAudio.playbackRate).toBe(1.5);

    // Stop playing
    Sound.isPlaying[eid] = 0;
    soundSystem(world);

    // Verify sound was stopped
    expect(playingAudio.pause).toHaveBeenCalled();
    expect(playingAudio.currentTime).toBe(0);
  });

  it("should handle looping sounds", async () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up looping sound entity
    addComponent(world, eid, Sound);
    Sound.src[eid] = "/test-sound.mp3";
    Sound.isPlaying[eid] = 1;
    Sound.isLooping[eid] = 1;

    const soundSystem = createSoundSystem();

    // Wait for sound to "load"
    await new Promise((resolve) => setTimeout(resolve, 0));

    soundSystem(world);

    // Verify sound is set to loop
    expect(mockAudio.cloneNode).toHaveBeenCalled();
    const playingAudio = mockAudio.cloneNode();
    expect(playingAudio.loop).toBe(true);
  });

  it("should update sound parameters while playing", async () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up sound entity
    addComponent(world, eid, Sound);
    Sound.src[eid] = "/test-sound.mp3";
    Sound.isPlaying[eid] = 1;
    Sound.volume[eid] = 0.5;
    Sound.playbackRate[eid] = 1;

    const soundSystem = createSoundSystem();

    // Wait for sound to "load"
    await new Promise((resolve) => setTimeout(resolve, 0));

    soundSystem(world);

    // Change parameters
    Sound.volume[eid] = 0.7;
    Sound.playbackRate[eid] = 2;

    soundSystem(world);

    // Verify parameters were updated
    expect(mockAudio.cloneNode).toHaveBeenCalled();
    const playingAudio = mockAudio.cloneNode();
    expect(playingAudio.volume).toBe(0.7);
    expect(playingAudio.playbackRate).toBe(2);
  });

  it("should handle spatial audio", async () => {
    const world = createWorld();
    const eid = addEntity(world);

    // Set up sound entity with position
    addComponent(world, eid, Sound);
    addComponent(world, eid, Transform);
    Sound.src[eid] = "/test-sound.mp3";
    Sound.isPlaying[eid] = 1;
    Sound.volume[eid] = 1;
    Sound.maxDistance[eid] = 1000;
    Sound.panX[eid] = 500; // Half max distance
    Sound.panY[eid] = 0;

    const soundSystem = createSoundSystem();

    // Wait for sound to "load"
    await new Promise((resolve) => setTimeout(resolve, 0));

    soundSystem(world);

    // Verify distance-based volume calculation
    expect(mockAudio.cloneNode).toHaveBeenCalled();
    const playingAudio = mockAudio.cloneNode();
    expect(playingAudio.volume).toBe(0.5); // Volume should be halved at half max distance
  });
});
