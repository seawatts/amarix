import { addComponent, addEntity, IsA } from "bitecs";

import type { World } from "../types";
import {
  Acceleration,
  Clickable,
  Collidable,
  Force,
  Gravity,
  Health,
  HostileNPC,
  InteractionCooldown,
  Named,
  NPC,
  NPCInteraction,
  Polygon,
  RigidBody,
  SaveableMapEntity,
  Sound,
  Sprite,
  Style,
  Transform,
  Velocity,
} from "../components";

// ... rest of imports ...

export function createHostileNPC(
  world: World,
  options: CreateHostileNPCOptions,
) {
  const eid = addEntity(world);

  // Add NPC components
  addComponent(
    world,
    eid,
    Transform,
    NPC,
    HostileNPC,
    Health,
    Polygon,
    IsA(world.prefabs.shape),
    RigidBody,
    Collidable,
    Clickable,
    Sprite,
    Sound,
    Gravity,
    Acceleration,
    Velocity,
    Force,
    Named,
    Style,
    NPCInteraction,
    InteractionCooldown,
    SaveableMapEntity,
  );

  // Initialize SaveableMapEntity
  SaveableMapEntity.eid[eid] = eid;

  // ... rest of the function ...
}
