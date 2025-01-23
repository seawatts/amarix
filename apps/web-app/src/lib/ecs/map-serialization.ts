import {
  createSnapshotDeserializer,
  createSnapshotSerializer,
} from "bitecs/serialization";

import type { MapMetadata, World } from "./types";
import {
  BoundingBox,
  Collidable,
  CollisionManifold,
  HostileNPC,
  NPC,
  NPCInteraction,
  Polygon,
  RigidBody,
  SaveableMapEntity,
  Transform,
} from "./components";

const mapComponents = [
  Transform,
  BoundingBox,
  Polygon,
  RigidBody,
  Collidable,
  CollisionManifold,
  NPC,
  HostileNPC,
  NPCInteraction,
  SaveableMapEntity,
];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (const byte of uint8Array) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index++) {
    const codePoint = binaryString.codePointAt(index);
    if (codePoint === undefined) continue;
    uint8Array[index] = codePoint;
  }
  return uint8Array.buffer;
}

export function generateMapFilename(name: string, updatedAt: string): string {
  const timestamp = new Date(updatedAt).toISOString().replaceAll(/[:.]/g, "");
  return `${name}-v1-${timestamp}.map.json`;
}

export function serializeWorld(world: World): string {
  const serializer = createSnapshotSerializer(world, mapComponents);
  const serializedData = serializer();

  if (serializedData.byteLength === 0) {
    throw new Error("No entities to save");
  }

  return arrayBufferToBase64(serializedData);
}

export function deserializeWorld(world: World, data: string): void {
  const deserializer = createSnapshotDeserializer(world, mapComponents);
  const binaryData = base64ToArrayBuffer(data);

  if (binaryData.byteLength === 0) {
    return;
  }

  deserializer(binaryData);
}

export function createMapMetadata(
  metadata: Omit<
    MapMetadata,
    "version" | "updatedAt" | "createdAt" | "schemaVersion"
  >,
): MapMetadata {
  const now = new Date().toISOString();
  return {
    ...metadata,
    createdAt: now,
    schemaVersion: 1,
    updatedAt: now,
    version: "v1",
  };
}
