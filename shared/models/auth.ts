import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  country: varchar("country"),
  password: varchar("password"),
  currency: varchar("currency").default("USD"),
  language: varchar("language").default("en"),
  theme: varchar("theme").default("light"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  anonymousAnalytics: boolean("anonymous_analytics").default(false).notNull(),
  shareDataToImproveAi: boolean("share_data_to_improve_ai").default(false).notNull(),
  productUpdatesEmail: boolean("product_updates_email").default(true).notNull(),
  marketingCommunications: boolean("marketing_communications").default(false).notNull(),
  dataRetentionYears: integer("data_retention_years"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
