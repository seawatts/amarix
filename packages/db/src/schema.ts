import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { createId } from "@acme/id";

export const userRoleEnum = pgEnum("userRole", ["admin", "superAdmin", "user"]);

export const UserRoleType = z.enum(userRoleEnum.enumValues).Enum;

export const Users = pgTable("user", {
  avatarUrl: text("avatarUrl"),
  clerkId: text("clerkId").unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  email: text("email").notNull().unique(),
  firstName: text("firstName"),
  id: varchar("id", { length: 128 }).notNull().primaryKey(),
  lastLoggedInAt: timestamp("lastLoggedInAt", {
    mode: "date",
    withTimezone: true,
  }),
  lastName: text("lastName"),
  online: boolean("online").default(false).notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const UsersRelations = relations(Users, ({ many }) => ({
  orgMembers: many(OrgMembers, {
    relationName: "user",
  }),
}));

export type UserType = typeof Users.$inferSelect;

export const CreateUserSchema = createInsertSchema(Users, {
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  online: z.boolean(),
}).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const Orgs = pgTable("orgs", {
  // batch: varchar("batch", { length: 50 }),
  clerkOrgId: text("clerkOrgId"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  createdByUserId: varchar("createdByUserId")
    .references(() => Users.id, {
      onDelete: "cascade",
    })
    .notNull(),
  id: varchar("id", { length: 128 })
    .$defaultFn(() => createId({ prefix: "org" }))
    .notNull()
    .primaryKey(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export type OrgType = typeof Orgs.$inferSelect;

export const updateOrgSchema = createInsertSchema(Orgs, {}).omit({
  createdAt: true,
  createdByUserId: true,
  id: true,
  updatedAt: true,
});

export const OrgsRelations = relations(Orgs, ({ one, many }) => ({
  createdByUser: one(Users, {
    fields: [Orgs.createdByUserId],
    references: [Users.id],
  }),
  orgMembers: many(OrgMembers),
}));

// Company Members Table
export const OrgMembers = pgTable(
  "orgMembers",
  {
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    createdByUserId: varchar("createdByUserId")
      .references(() => Users.id, {
        onDelete: "cascade",
      })
      .notNull(),
    id: varchar("id", { length: 128 })
      .$defaultFn(() => createId({ prefix: "member" }))
      .notNull()
      .primaryKey(),
    orgId: varchar("orgId")
      .references(() => Orgs.id, {
        onDelete: "cascade",
      })
      .notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar("userId")
      .references(() => Users.id, {
        onDelete: "cascade",
      })
      .notNull(),
  },
  (table) => ({
    orgUserUnique: unique().on(table.orgId, table.userId),
  }),
);

export type OrgMembersType = typeof OrgMembers.$inferSelect & {
  user?: UserType;
  org?: OrgType;
};

export const OrgMembersRelations = relations(OrgMembers, ({ one }) => ({
  createdByUser: one(Users, {
    fields: [OrgMembers.createdByUserId],
    references: [Users.id],
    relationName: "createdByUser",
  }),
  org: one(Orgs, {
    fields: [OrgMembers.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [OrgMembers.userId],
    references: [Users.id],
    relationName: "user",
  }),
}));

export const ShortUrl = pgTable("short_url", {
  code: text("code").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  id: varchar("id", { length: 128 })
    .$defaultFn(() => createId({ prefix: "url" }))
    .notNull()
    .primaryKey(),
  redirectUrl: text("redirectUrl").notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const Maps = pgTable("maps", {
  autoSaveLastSave: timestamp("autoSaveLastSave", {
    mode: "date",
    withTimezone: true,
  }),
  autoSaveSequence: text("autoSaveSequence"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  createdByUserId: varchar("createdByUserId")
    .references(() => Users.id, {
      onDelete: "cascade",
    })
    .notNull(),
  data: text("data").notNull(),
  dataUrl: text("dataUrl"),
  description: text("description"),
  editorState: text("editorState"),
  height: integer("height").notNull(),
  id: varchar("id", { length: 128 })
    .$defaultFn(() => createId({ prefix: "map" }))
    .notNull()
    .primaryKey(),
  isTemplate: boolean("isTemplate").default(false),
  lastEditedByUserId: varchar("lastEditedByUserId").references(() => Users.id),
  name: varchar("name", { length: 64 }).notNull(),
  parentMapId: varchar("parentMapId", { length: 128 }),
  schemaVersion: varchar("schemaVersion", { length: 32 }).notNull(),
  tags: text("tags").array(),
  thumbnailUrl: text("thumbnailUrl"),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  version: varchar("version", { length: 32 }).notNull(),
  width: integer("width").notNull(),
});

export type MapType = typeof Maps.$inferSelect;

export const MapsRelations = relations(Maps, ({ one }) => {
  return {
    createdByUser: one(Users, {
      fields: [Maps.createdByUserId],
      references: [Users.id],
    }),
    lastEditedByUser: one(Users, {
      fields: [Maps.lastEditedByUserId],
      references: [Users.id],
    }),
    parentMap: one(Maps, {
      fields: [Maps.parentMapId],
      references: [Maps.id],
    }),
  };
});

export const createMapSchema = createInsertSchema(Maps, {
  editorState: z.string(),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Map name must contain only lowercase letters, numbers, and hyphens",
    }),
  tags: z.array(z.string()),
}).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});
