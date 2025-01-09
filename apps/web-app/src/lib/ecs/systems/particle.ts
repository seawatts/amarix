import type { World } from "bitecs";
import { addComponent, addEntity, query, removeEntity } from "bitecs";

import { Particle, ParticleEmitter, Transform } from "../components";

// Create a new particle
function createParticle(
  world: World,
  emitterEid: number,
  x: number,
  y: number,
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Particle);

  // Set initial particle values
  Particle.x[eid] = x;
  Particle.y[eid] = y;
  Particle.isActive[eid] = 1;
  Particle.maxLife[eid] = ParticleEmitter.particleLife[emitterEid] ?? 1000;
  Particle.life[eid] = 1;
  Particle.alpha[eid] = ParticleEmitter.particleAlpha[emitterEid] ?? 1;
  Particle.color[eid] = ParticleEmitter.particleColor[emitterEid] ?? "#ffffff";
  Particle.size[eid] = ParticleEmitter.particleSize[emitterEid] ?? 5;

  // Calculate random velocity within speed range
  const minSpeed = ParticleEmitter.particleSpeedMin[emitterEid] ?? 1;
  const maxSpeed = ParticleEmitter.particleSpeedMax[emitterEid] ?? 5;
  const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  const angle = Math.random() * Math.PI * 2;

  Particle.velocityX[eid] = Math.cos(angle) * speed;
  Particle.velocityY[eid] = Math.sin(angle) * speed;

  return eid;
}

// Create the particle system
export function createParticleSystem() {
  return function particleSystem(world: World) {
    const emitters = query(world, [ParticleEmitter, Transform]);
    const particles = query(world, [Particle]);

    // Update emitters
    for (const emitterEid of emitters) {
      if (!(ParticleEmitter.isActive[emitterEid] ?? 0)) continue;

      const maxParticles = ParticleEmitter.maxParticles[emitterEid] ?? -1;
      const totalEmitted = ParticleEmitter.totalEmitted[emitterEid] ?? 0;

      // Check if we've reached the particle limit
      if (maxParticles !== -1 && totalEmitted >= maxParticles) {
        ParticleEmitter.isActive[emitterEid] = 0;
        continue;
      }

      // Update emission timer
      const emissionTimer =
        (ParticleEmitter.emissionTimer[emitterEid] ?? 0) + 1000 / 60;
      const emissionRate = ParticleEmitter.emissionRate[emitterEid] ?? 1;
      const emissionInterval = 1000 / emissionRate;

      // Emit particles
      if (emissionTimer >= emissionInterval) {
        ParticleEmitter.emissionTimer[emitterEid] = 0;

        // Get spawn position
        const x = Transform.x[emitterEid] ?? 0;
        const y = Transform.y[emitterEid] ?? 0;
        const radius = ParticleEmitter.spawnRadius[emitterEid] ?? 0;

        // Add random offset within spawn radius
        // Use square root of random to get uniform distribution within circle
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnRadius = Math.sqrt(Math.random()) * radius;
        const spawnX = x + Math.cos(spawnAngle) * spawnRadius;
        const spawnY = y + Math.sin(spawnAngle) * spawnRadius;

        // Create particle
        createParticle(world, emitterEid, spawnX, spawnY);
        ParticleEmitter.totalEmitted[emitterEid] = totalEmitted + 1;
      } else {
        ParticleEmitter.emissionTimer[emitterEid] = emissionTimer;
      }
    }

    // Update particles
    for (const eid of particles) {
      if (!(Particle.isActive[eid] ?? 0)) {
        removeEntity(world, eid);
        continue;
      }

      // Update position
      const x = Particle.x[eid] ?? 0;
      const y = Particle.y[eid] ?? 0;
      const velocityX = Particle.velocityX[eid] ?? 0;
      const velocityY = Particle.velocityY[eid] ?? 0;

      Particle.x[eid] = x + velocityX;
      Particle.y[eid] = y + velocityY;

      // Update life
      const life = Particle.life[eid] ?? 0;
      const maxLife = Particle.maxLife[eid] ?? 1000;
      const newLife = Math.max(0, life - 1000 / 60 / maxLife);

      if (newLife <= 0) {
        Particle.isActive[eid] = 0;
      } else {
        Particle.life[eid] = newLife;
        // Update alpha based on life
        Particle.alpha[eid] = newLife;
      }
    }

    return world;
  };
}

// Helper function to create a particle emitter
export function createParticleEmitter(
  world: World,
  config: {
    x: number;
    y: number;
    emissionRate?: number;
    maxParticles?: number;
    particleLife?: number;
    particleAlpha?: number;
    particleColor?: string;
    particleSize?: number;
    particleSpeedMin?: number;
    particleSpeedMax?: number;
    spawnRadius?: number;
  },
): number {
  const eid = addEntity(world);
  addComponent(world, eid, Transform);
  addComponent(world, eid, ParticleEmitter);

  // Set position
  Transform.x[eid] = config.x;
  Transform.y[eid] = config.y;

  // Set emitter properties
  ParticleEmitter.isActive[eid] = 1;
  ParticleEmitter.emissionRate[eid] = config.emissionRate ?? 10;
  ParticleEmitter.maxParticles[eid] = config.maxParticles ?? -1;
  ParticleEmitter.emissionTimer[eid] = 0;
  ParticleEmitter.totalEmitted[eid] = 0;

  // Set particle properties
  ParticleEmitter.particleLife[eid] = config.particleLife ?? 1000;
  ParticleEmitter.particleAlpha[eid] = config.particleAlpha ?? 1;
  ParticleEmitter.particleColor[eid] = config.particleColor ?? "#ffffff";
  ParticleEmitter.particleSize[eid] = config.particleSize ?? 5;
  ParticleEmitter.particleSpeedMin[eid] = config.particleSpeedMin ?? 1;
  ParticleEmitter.particleSpeedMax[eid] = config.particleSpeedMax ?? 5;
  ParticleEmitter.spawnRadius[eid] = config.spawnRadius ?? 0;

  return eid;
}
