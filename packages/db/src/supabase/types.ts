import type { InferSelectModel } from 'drizzle-orm'

import type { Maps, OrgMembers, Orgs, ShortUrl, Users } from '../schema'

export interface Tables {
  orgMembers: InferSelectModel<typeof OrgMembers>
  orgs: InferSelectModel<typeof Orgs>
  short_url: InferSelectModel<typeof ShortUrl>
  user: InferSelectModel<typeof Users>
  maps: InferSelectModel<typeof Maps>
}

export type TableName = keyof Tables

export interface Database {
  public: {
    Tables: {
      [K in TableName]: {
        Row: Tables[K]
      }
    }
  }
}
