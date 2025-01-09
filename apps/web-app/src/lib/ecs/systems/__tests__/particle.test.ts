import { createWorld, hasComponent } from "bitecs";
import { describe, expect, it } from "vitest";

import { Particle, ParticleEmitter, Transform } from "../../components";
import { createParticleEmitter, createParticleSystem } from "../particle";

describe.skip("Particle System", () => {
  it("should create particle emitter with default config", () => {
    const world = createWorld();
    const emitterEid = createParticleEmitter(world, { x: 100, y: 200 });

    // Verify emitter components
    expect(hasComponent(world, emitterEid, Transform)).toBe(true);
    expect(hasComponent(world, emitterEid, ParticleEmitter)).toBe(true);

    // Verify default values
    expect(Transform.x[emitterEid]).toBe(100);
    expect(Transform.y[emitterEid]).toBe(200);
    expect(ParticleEmitter.isActive[emitterEid]).toBe(1);
    expect(ParticleEmitter.emissionRate[emitterEid]).toBe(10);
    expect(ParticleEmitter.maxParticles[emitterEid]).toBe(-1);
    expect(ParticleEmitter.particleLife[emitterEid]).toBe(1000);
    expect(ParticleEmitter.particleAlpha[emitterEid]).toBe(1);
    expect(ParticleEmitter.particleColor[emitterEid]).toBe("#ffffff");
    expect(ParticleEmitter.particleSize[emitterEid]).toBe(5);
    expect(ParticleEmitter.particleSpeedMin[emitterEid]).toBe(1);
    expect(ParticleEmitter.particleSpeedMax[emitterEid]).toBe(5);
    expect(ParticleEmitter.spawnRadius[emitterEid]).toBe(0);
  });

  it("should create particle emitter with custom config", () => {
    const world = createWorld();
    const config = {
      emissionRate: 20,
      maxParticles: 100,
      particleAlpha: 0.8,
      particleColor: "#ff0000",
      particleLife: 500,
      particleSize: 10,
      particleSpeedMax: 8,
      particleSpeedMin: 2,
      spawnRadius: 50,
      x: 100,
      y: 200,
    };

    const emitterEid = createParticleEmitter(world, config);

    // Verify custom values
    expect(ParticleEmitter.emissionRate[emitterEid]).toBe(20);
    expect(ParticleEmitter.maxParticles[emitterEid]).toBe(100);
    expect(ParticleEmitter.particleLife[emitterEid]).toBe(500);
    expect(ParticleEmitter.particleAlpha[emitterEid]).toBeCloseTo(0.8, 4);
    expect(ParticleEmitter.particleColor[emitterEid]).toBe("#ff0000");
    expect(ParticleEmitter.particleSize[emitterEid]).toBe(10);
    expect(ParticleEmitter.particleSpeedMin[emitterEid]).toBe(2);
    expect(ParticleEmitter.particleSpeedMax[emitterEid]).toBe(8);
    expect(ParticleEmitter.spawnRadius[emitterEid]).toBe(50);
  });

  it("should emit particles at specified rate", () => {
    const world = createWorld();
    createParticleEmitter(world, {
      emissionRate: 60,
      x: 100,
      y: 200, // 1 particle per frame at 60 FPS
    });

    const particleSystem = createParticleSystem();

    // Run for one frame
    particleSystem(world);

    // Should have emitted one particle
    const particles = Object.keys(Particle.isActive).filter(
      (eid) => Particle.isActive[Number(eid)] === 1,
    );
    expect(particles).toHaveLength(1);

    // Verify particle properties
    const particleEid = Number(particles[0]);
    expect(Particle.life[particleEid]).toBeCloseTo(1, 4);
    expect(Particle.maxLife[particleEid]).toBe(1000);
    expect(Particle.alpha[particleEid]).toBe(1);
    expect(Particle.color[particleEid]).toBe("#ffffff");
    expect(Particle.size[particleEid]).toBe(5);
    expect(Particle.velocityX[particleEid]).toBeDefined();
    expect(Particle.velocityY[particleEid]).toBeDefined();
  });

  it("should respect max particles limit", () => {
    const world = createWorld();
    const emitterEid = createParticleEmitter(world, {
      emissionRate: 60,
      maxParticles: 2,
      x: 100,
      y: 200,
    });

    const particleSystem = createParticleSystem();

    // Run for three frames
    particleSystem(world);
    particleSystem(world);
    particleSystem(world);

    // Should have emitted only two particles
    const particles = Object.keys(Particle.isActive).filter(
      (eid) => Particle.isActive[Number(eid)] === 1,
    );
    expect(particles).toHaveLength(2);

    // Emitter should be inactive
    expect(ParticleEmitter.isActive[emitterEid]).toBe(0);
  });

  it("should update particle positions based on velocity", () => {
    const world = createWorld();
    createParticleEmitter(world, {
      emissionRate: 60,
      particleSpeedMax: 1,
      particleSpeedMin: 1,
      x: 100,
      y: 200, // Fixed speed for predictable test
    });

    const particleSystem = createParticleSystem();

    // Emit one particle
    particleSystem(world);

    const particleEid = Number(
      Object.keys(Particle.isActive).find(
        (eid) => Particle.isActive[Number(eid)] === 1,
      ),
    );

    const initialX = Particle.x[particleEid] ?? 0;
    const initialY = Particle.y[particleEid] ?? 0;
    const velocityX = Particle.velocityX[particleEid] ?? 0;
    const velocityY = Particle.velocityY[particleEid] ?? 0;

    // Update particle
    particleSystem(world);

    // Position should be updated by velocity
    expect(Particle.x[particleEid]).toBeCloseTo(initialX + velocityX, 4);
    expect(Particle.y[particleEid]).toBeCloseTo(initialY + velocityY, 4);
  });

  it("should remove particles when life reaches zero", () => {
    const world = createWorld();
    createParticleEmitter(world, {
      emissionRate: 60,
      particleLife: 16,
      x: 100,
      y: 200, // Very short life (about 0.25s at 60 FPS)
    });

    const particleSystem = createParticleSystem();

    // Emit one particle
    particleSystem(world);

    const particleEid = Number(
      Object.keys(Particle.isActive).find(
        (eid) => Particle.isActive[Number(eid)] === 1,
      ),
    );

    // Run until particle should be dead
    for (let index = 0; index < 20; index++) {
      particleSystem(world);
    }

    // Particle should be removed
    expect(Particle.isActive[particleEid]).toBe(0);
  });

  it("should spawn particles within radius", () => {
    const world = createWorld();
    const spawnRadius = 50;
    createParticleEmitter(world, {
      emissionRate: 60,
      spawnRadius,
      x: 100,
      y: 200,
    });

    const particleSystem = createParticleSystem();

    // Emit several particles
    for (let index = 0; index < 10; index++) {
      particleSystem(world);
    }

    // Check that all particles are within spawn radius
    const particles = Object.keys(Particle.isActive).filter(
      (eid) => Particle.isActive[Number(eid)] === 1,
    );

    for (const eidString of particles) {
      const eid = Number(eidString);
      const dx = (Particle.x[eid] ?? 0) - 100; // Distance from emitter X
      const dy = (Particle.y[eid] ?? 0) - 200; // Distance from emitter Y
      const distance = Math.hypot(dx, dy);
      expect(distance).toBeLessThanOrEqual(spawnRadius);
    }
  });
});
