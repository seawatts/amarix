import { query } from 'bitecs'

import { Sound } from '../components'
import type { World } from '../types'

// Cache for loaded audio
const audioCache = new Map<string, HTMLAudioElement>()
const playingSounds = new Map<number, HTMLAudioElement>()

// Load an audio file and cache it
async function _loadSound(source: string): Promise<HTMLAudioElement> {
  const cached = audioCache.get(source)
  if (cached) return cached

  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.addEventListener('canplaythrough', () => {
      audioCache.set(source, audio)
      resolve(audio)
    })
    audio.addEventListener('error', reject)
    audio.src = source
    audio.load()
  })
}

// Create the sound system
export function createSoundSystem() {
  return function soundSystem(world: World) {
    const entities = query(world, [Sound])

    // Load and update sounds
    for (const eid of entities) {
      const source = Sound.src[eid]
      if (typeof source !== 'string' || source.length === 0) continue

      // Load sound if not cached
      if (!audioCache.has(source)) {
        // void loadSound(source).catch(console.error);
        continue
      }

      const audio = audioCache.get(source)
      if (!audio) continue

      const isPlaying = Sound.isPlaying[eid] === 1
      const currentlyPlaying = playingSounds.has(eid)

      // Start playing if needed
      if (isPlaying && !currentlyPlaying) {
        const newAudio = audio.cloneNode() as HTMLAudioElement
        newAudio.loop = Sound.isLooping[eid] === 1
        newAudio.volume = Sound.volume[eid] ?? 1
        newAudio.playbackRate = Sound.playbackRate[eid] ?? 1

        // Handle sound completion
        newAudio.addEventListener('ended', () => {
          if (!newAudio.loop) {
            Sound.isPlaying[eid] = 0
            playingSounds.delete(eid)
          }
        })

        void newAudio.play().catch(console.error)
        playingSounds.set(eid, newAudio)
      }
      // Stop playing if needed
      else if (!isPlaying && currentlyPlaying) {
        const playingAudio = playingSounds.get(eid)
        if (playingAudio) {
          playingAudio.pause()
          playingAudio.currentTime = 0
          playingSounds.delete(eid)
        }
      }
      // Update sound parameters if still playing
      else if (currentlyPlaying) {
        const playingAudio = playingSounds.get(eid)
        if (playingAudio) {
          // Calculate spatial audio parameters
          const volume = Sound.volume[eid] ?? 1
          const maxDistance = Sound.maxDistance[eid] ?? 1000
          const panX = Sound.panX[eid] ?? 0
          const panY = Sound.panY[eid] ?? 0

          // Apply distance-based volume
          const distance = Math.hypot(panX, panY)
          const distanceScale = Math.max(0, 1 - distance / maxDistance)
          playingAudio.volume = volume * distanceScale
          playingAudio.playbackRate = Sound.playbackRate[eid] ?? 1
        }
      }
    }
  }
}

// Clear audio cache (for testing)
export function clearAudioCache() {
  audioCache.clear()
  playingSounds.clear()
}
