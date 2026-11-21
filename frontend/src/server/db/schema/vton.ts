import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  check,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { products } from "./commerce";

// =============================================================================
// VIRTUAL TRY-ON (VTON) JOBS
// =============================================================================

export const vtonJobs = pgTable(
  "vton_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    sourceImageKey: text("source_image_key").notNull(),
    resultImageKey: text("result_image_key"),
    provider: text("provider").notNull().default("idm-vton"),
    mode: text("mode").notNull().default("fallback_demo"),
    status: text("status").notNull().default("queued"),
    errorCode: text("error_code"),
    rawExpiresAt: timestamp("raw_expires_at", { withTimezone: true }).notNull(),
    resultExpiresAt: timestamp("result_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "vton_jobs_mode_check",
      sql`${table.mode} IN ('live_ai', 'fallback_demo')`
    ),
    check(
      "vton_jobs_status_check",
      sql`${table.status} IN ('queued', 'processing', 'succeeded', 'failed', 'timed_out')`
    ),
    index("vton_jobs_user_status_expiry_idx").on(
      table.userId,
      table.status,
      table.rawExpiresAt,
      table.resultExpiresAt
    ),
  ]
);

// =============================================================================
// GOVERNANCE & INQUIRIES
// =============================================================================

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    action: text("action").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "admin_audit_logs_target_type_check",
      sql`${table.targetType} IN ('partner', 'product', 'order', 'checkout_group', 'user')`
    ),
    index("admin_audit_logs_actor_idx").on(table.actorUserId),
  ]
);

export const contactInquiries = pgTable("contact_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
