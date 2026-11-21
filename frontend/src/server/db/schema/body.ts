import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  jsonb,
  index,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// =============================================================================
// ANTHROPOMETRIC BODY PROFILES & MEASUREMENT HISTORY
// =============================================================================

export const bodyProfiles = pgTable(
  "body_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    heightCm: numeric("height_cm", { precision: 6, scale: 1 }).notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
    bodyType: text("body_type"),
    chestCm: numeric("chest_cm", { precision: 6, scale: 1 }).notNull(),
    waistCm: numeric("waist_cm", { precision: 6, scale: 1 }).notNull(),
    hipCm: numeric("hip_cm", { precision: 6, scale: 1 }),
    shoulderCm: numeric("shoulder_cm", { precision: 6, scale: 1 }),
    sleeveCm: numeric("sleeve_cm", { precision: 6, scale: 1 }),
    inseamCm: numeric("inseam_cm", { precision: 6, scale: 1 }),
    fitPreference: text("fit_preference").notNull().default("regular"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "body_profiles_height_check",
      sql`${table.heightCm} >= 130.0 AND ${table.heightCm} <= 220.0`
    ),
    check(
      "body_profiles_chest_check",
      sql`${table.chestCm} >= 70.0 AND ${table.chestCm} <= 150.0`
    ),
    check(
      "body_profiles_waist_check",
      sql`${table.waistCm} >= 55.0 AND ${table.waistCm} <= 140.0`
    ),
    check(
      "body_profiles_fit_pref_check",
      sql`${table.fitPreference} IN ('slim', 'regular', 'relaxed', 'oversized')`
    ),
  ]
);

export const measurementHistory = pgTable(
  "measurement_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chestCm: numeric("chest_cm", { precision: 6, scale: 1 }).notNull(),
    waistCm: numeric("waist_cm", { precision: 6, scale: 1 }).notNull(),
    note: text("note"),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    fullSnapshot: jsonb("full_snapshot"),
  },
  (table) => [
    index("measurement_history_user_idx").on(table.userId),
  ]
);

// =============================================================================
// 3D AVATAR SERVICE OWNERSHIP
// =============================================================================

export const avatars = pgTable(
  "avatars",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    avatarId: text("avatar_id").notNull().unique(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("avatars_user_id_idx").on(table.userId),
  ]
);

// =============================================================================
// RELATIONS
// =============================================================================

export const avatarsRelations = relations(avatars, ({ one }) => ({
  user: one(users, {
    fields: [avatars.userId],
    references: [users.id],
  }),
}));
