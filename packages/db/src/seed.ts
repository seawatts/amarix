/* eslint-disable drizzle/enforce-delete-with-where */
import { seed } from 'drizzle-seed'

import { createId } from '@acme/id'

import { db } from './client'
import {
  Maps,
  Orgs,
  ShortUrl,
  Users,
  // walkStatusEnum,
} from './schema'

// Reset all tables

await db.delete(Users)
await db.delete(Orgs)
await db.delete(ShortUrl)
await db.delete(Maps)

await seed(db, {
  Maps,
  Orgs,
  ShortUrl,
  Users,
}).refine((funcs) => ({
  Maps: {
    columns: {
      description: funcs.loremIpsum(),
      height: funcs.int({ maxValue: 1000, minValue: 1000 }),
      id: funcs.default({ defaultValue: createId({ prefix: 'map_' }) }),
      name: funcs.city(),
      width: funcs.int({ maxValue: 1000, minValue: 1000 }),
    },
    count: 1,
  },
  Orgs: {
    columns: {
      id: funcs.default({ defaultValue: 'org_2s0lvufAzQgpcvjJisOoTVbcfeP' }),
    },
    count: 1,
  },
  Users: {
    columns: {
      clerkId: funcs.default({
        defaultValue: 'user_2s0lvufAzQgpcvjJisOoTVbcfeP',
      }),
      email: funcs.email(),
      firstName: funcs.firstName(),
      id: funcs.default({ defaultValue: 'user_2s0lvufAzQgpcvjJisOoTVbcfeP' }),
      lastName: funcs.lastName(),
      online: funcs.boolean(),
    },
    count: 1,
  },
}))

// eslint-disable-next-line unicorn/no-process-exit
process.exit(0)
