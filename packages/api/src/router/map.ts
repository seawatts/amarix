import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@acme/db/client'
import { Maps } from '@acme/db/schema'

import { createTRPCRouter, protectedProcedure } from '../trpc'

const defaultMapData = {
  data: '{}',
  height: 1000,
  schemaVersion: '1',
  version: '1',
  width: 1000,
} as const

export const mapRouter = createTRPCRouter({
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.query.Maps.findFirst({
        where: (maps, { eq }) => eq(maps.id, input.id),
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [map] = await db
        .insert(Maps)
        .values({
          ...defaultMapData,
          createdByUserId: ctx.auth.userId,
          name: input.name,
        })
        .returning()

      return map
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [map] = await db
        .delete(Maps)
        .where(
          and(eq(Maps.id, input.id), eq(Maps.createdByUserId, ctx.auth.userId)),
        )
        .returning()

      return map
    }),

  list: protectedProcedure.query(async () => {
    return db.query.Maps.findMany({
      orderBy: [desc(Maps.updatedAt)],
    })
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [map] = await db
        .update(Maps)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(
          and(eq(Maps.id, input.id), eq(Maps.createdByUserId, ctx.auth.userId)),
        )
        .returning()

      return map
    }),
})
