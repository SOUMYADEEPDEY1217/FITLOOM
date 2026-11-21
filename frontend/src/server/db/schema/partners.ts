import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { products, orders, customfitRequests } from "./commerce";

// =============================================================================
// PARTNERS & WORKSHOPS
// =============================================================================

export const partners = pgTable(
  "partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    verificationStatus: text("verification_status")
      .notNull()
      .default("pending_review"),
    operationalStatus: text("operational_status")
      .notNull()
      .default("active"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("partners_owner_type_unique").on(
      table.ownerUserId,
      table.type
    ),
    check(
      "partners_type_check",
      sql`${table.type} IN ('seller', 'tailor')`
    ),
    check(
      "partners_verification_status_check",
      sql`${table.verificationStatus} IN ('pending_review', 'verified', 'rejected')`
    ),
    check(
      "partners_operational_status_check",
      sql`${table.operationalStatus} IN ('active', 'suspended')`
    ),
  ]
);

export const tailorProfiles = pgTable(
  "tailor_profiles",
  {
    partnerId: uuid("partner_id")
      .primaryKey()
      .references(() => partners.id, { onDelete: "cascade" }),
    specialties: text("specialties").notNull(),
    baseTailoringFeeInr: integer("base_tailoring_fee_inr").notNull(),
    turnaroundDays: integer("turnaround_days").notNull(),
    weeklyCapacityOrders: integer("weekly_capacity_orders").notNull(),
    acceptingCustomOrders: boolean("accepting_custom_orders")
      .notNull()
      .default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "tailor_profiles_fee_check",
      sql`${table.baseTailoringFeeInr} >= 0`
    ),
    check(
      "tailor_profiles_turnaround_check",
      sql`${table.turnaroundDays} >= 1`
    ),
    check(
      "tailor_profiles_capacity_check",
      sql`${table.weeklyCapacityOrders} >= 1`
    ),
  ]
);

// =============================================================================
// RELATIONS
// =============================================================================

export const partnersRelations = relations(partners, ({ one, many }) => ({
  owner: one(users, {
    fields: [partners.ownerUserId],
    references: [users.id],
  }),
  tailorProfile: one(tailorProfiles, {
    fields: [partners.id],
    references: [tailorProfiles.partnerId],
  }),
  products: many(products),
  standardOrders: many(orders, { relationName: "sellerOrders" }),
  customfitOrders: many(orders, { relationName: "tailorOrders" }),
  customfitRequests: many(customfitRequests),
}));
