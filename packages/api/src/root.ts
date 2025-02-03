import { authRouter } from './router/auth'
import { mapRouter } from './router/map'
import { userRouter } from './router/user'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  map: mapRouter,
  user: userRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
