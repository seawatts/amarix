import type { World } from "bitecs";
import { query } from "bitecs";

import { Sound, Transform } from "../components";

// Cache for loaded audio
const audioCache = new Map<string, HTMLAudioElement>();

// Load an audio file and cache it
async function loadSound(source: string): Promise<HTMLAudioElement> {
  const cached = audioCache.get(source);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener("canplaythrough", () => {
      audioCache.set(source, audio);
      resolve(audio);
    });
    audio.addEventListener("error", reject);
    audio.src = source;
    audio.load();
  });
}

// Create the sound system
export function createSoundSystem() {
  // Track loaded and playing sounds
  const loadedSounds = new Set<string>();
  const playingSounds = new Map<number, HTMLAudioElement>();

  return function soundSystem(world: World) {
    const entities = query(world, [Sound]);
    const entitiesWithPosition = query(world, [Sound, Transform]);

    // Load any new sounds
    for (const eid of entities) {
      const source = Sound.src[eid];
      if (
        typeof source === "string" &&
        source.length > 0 &&
        !loadedSounds.has(source)
      ) {
        loadedSounds.add(source);
        void loadSound(source).catch(console.error);
      }
    }

    // Update playing sounds
    for (const eid of entities) {
      const source = Sound.src[eid];
      if (typeof source !== "string" || source.length === 0) continue;

      const audio = audioCache.get(source);
      if (!audio) continue;

      const isPlaying = Sound.isPlaying[eid] ?? 0;
      const currentlyPlaying = playingSounds.has(eid);

      // Start playing if needed
      if (isPlaying && !currentlyPlaying) {
        const newAudio = audio.cloneNode() as HTMLAudioElement;
        newAudio.loop = (Sound.isLooping[eid] ?? 0) === 1;
        newAudio.volume = Sound.volume[eid] ?? 1;
        newAudio.playbackRate = Sound.playbackRate[eid] ?? 1;

        // Handle sound completion
        newAudio.addEventListener("ended", () => {
          if (!newAudio.loop) {
            Sound.isPlaying[eid] = 0;
            playingSounds.delete(eid);
          }
        });

        void newAudio.play().catch(console.error);
        playingSounds.set(eid, newAudio);
      }
      // Stop playing if needed
      else if (!isPlaying && currentlyPlaying) {
        const playingAudio = playingSounds.get(eid);
        if (playingAudio) {
          playingAudio.pause();
          playingAudio.currentTime = 0;
          playingSounds.delete(eid);
        }
      }
      // Update sound parameters if still playing
      else if (currentlyPlaying) {
        const playingAudio = playingSounds.get(eid);
        if (playingAudio) {
          playingAudio.volume = Sound.volume[eid] ?? 1;
          playingAudio.playbackRate = Sound.playbackRate[eid] ?? 1;
        }
      }
    }

    // Update spatial audio
    for (const eid of entitiesWithPosition) {
      const playingAudio = playingSounds.get(eid);
      if (!playingAudio) continue;

      const x = Transform.x[eid] ?? 0;
      const y = Transform.y[eid] ?? 0;
      const panX = Sound.panX[eid] ?? 0;
      const panY = Sound.panY[eid] ?? 0;
      const maxDistance = Sound.maxDistance[eid] ?? 1000;

      // Calculate distance-based volume
      const distance = Math.hypot(panX, panY);
      const volume = Math.max(0, 1 - distance / maxDistance);

      // Apply spatial audio effects if Web Audio API is available
      if (globalThis.AudioContext && playingAudio instanceof AudioContext) {
        // Add spatial audio implementation here when needed
        // This would involve creating an AudioContext and using PannerNode
      } else {
        // Fallback to basic stereo panning
        playingAudio.volume = (Sound.volume[eid] ?? 1) * volume;
      }
    }

    return world;
  };
}
