"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generateMapFilename } from "~/lib/ecs/map-serialization";
import { listMapFiles, readMapFile, writeMapFile } from "~/lib/ecs/map-storage";
import { mapMetadataSchema } from "~/lib/ecs/types";
import { authenticatedAction } from "~/safe-action";

const saveMapSchema = z.object({
  metadata: mapMetadataSchema,
  serializedWorld: z.string(),
});

const loadMapSchema = z.object({
  filePath: z.string(),
});

const listMapsSchema = z.object({
  filter: z
    .object({
      isTemplate: z.boolean(),
      tags: z.array(z.string()),
    })
    .optional(),
});

export const saveMapAction = authenticatedAction
  .createServerAction()
  .input(saveMapSchema)
  .handler(async ({ input }) => {
    const { metadata, serializedWorld } = input;
    const filename = generateMapFilename(metadata.name, metadata.updatedAt);
    await writeMapFile(filename, serializedWorld, metadata);
    revalidatePath("/game");
  });

export const loadMapAction = authenticatedAction
  .createServerAction()
  .input(loadMapSchema)
  .handler(async ({ input }) => {
    const { filePath } = input;
    const { data, metadata } = await readMapFile(filePath);
    const validatedMetadata = mapMetadataSchema.parse(metadata);
    return { metadata: validatedMetadata, serializedWorld: data };
  });

export const listMapsAction = authenticatedAction
  .createServerAction()
  .input(listMapsSchema)
  .handler(async ({ input }) => {
    const files = await listMapFiles();
    const maps = await Promise.all(
      files.map(async (file) => {
        const { metadata } = await readMapFile(file);
        return mapMetadataSchema.parse(metadata);
      }),
    );

    // Apply filters if provided
    let filteredMaps = maps;
    if (input.filter) {
      const { isTemplate, tags } = input.filter;
      filteredMaps = filteredMaps.filter((map) => {
        // Check template status
        if (map.isTemplate !== isTemplate) {
          return false;
        }

        // Check tags
        if (tags.length > 0) {
          const mapTags = map.tags ?? [];
          if (!tags.some((tag) => mapTags.includes(tag))) {
            return false;
          }
        }

        return true;
      });
    }

    return filteredMaps.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  });
