import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {nanoid} from 'nanoid'
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Legacy tables removed:
// - agents (no longer needed, AI functionality removed)
// - meetings (no longer needed, replaced by channels)
// - meetingStatus enum (no longer needed)

// Channels for team collaboration
export const channels = pgTable('channels', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Channel members (many-to-many relationship)
export const channelMembers = pgTable('channel_members', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Messages in channels
export const messages = pgTable('messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: text('content').notNull(),
  channelId: text('channel_id')
    .references(() => channels.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // File attachments (nullable for migration compatibility)
  attachments: text('attachments').array(), // Array of file URLs or base64 - nullable until migration
  attachmentTypes: text('attachment_types').array(), // 'image', 'file', 'voice' - nullable until migration
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$defaultFn(() => new Date()),
  pinned: boolean('pinned').default(false).notNull(),
})

// Personal notes
export const notes = pgTable('notes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags').array().notNull().$defaultFn(() => []), // Array of strings
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  pinned: boolean('pinned').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
