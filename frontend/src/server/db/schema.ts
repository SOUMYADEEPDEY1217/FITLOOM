import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

// =============================================================================
// 1. USERS & MULTI-ROLE CAPABILITIES
// =============================================================================

/**
 * Canonical user account identity (Better Auth compatible, BE-003).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    passwordHash: text("password_hash"),
    accountStatus: text("account_status").notNull().default("active"),
    phone: text("phone"),
    city: text("city"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "users_account_status_check",
      sql`${table.accountStatus} IN ('active', 'disabled')`
    ),
  ]
);

/**
 * Multi-Role Capability Model (DOC-013 Section 1.1).
 * Additive authorized capabilities per account ('customer', 'seller', 'tailor', 'admin').
 */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    grantedBy: uuid("granted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.role],
      name: "user_roles_pk",
    }),
    check(
      "user_roles_role_check",
      sql`${table.role} IN ('customer', 'seller', 'tailor', 'admin')`
    ),
  ]
);

// =============================================================================
// BETTER AUTH PERSISTENCE TABLES (BE-003)
// =============================================================================

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =============================================================================
// 2. PARTNERS & WORKSHOPS
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
// 3. ANTHROPOMETRIC BODY PROFILES & MEASUREMENT HISTORY
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
// 3.1 AVATARS (USER OWNERSHIP TO 3D AVATAR ENGINE)
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
// 4. CATALOGUE, GARMENTS & SIZING SPECIFICATIONS
// =============================================================================

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sellerPartnerId: uuid("seller_partner_id")
      .notNull()
      .references(() => partners.id),
    name: text("name").notNull(),
    category: text("category").notNull(),
    fitType: text("fit_type").notNull(),
    occasion: text("occasion").notNull(),
    color: text("color").notNull(),
    swatchHex: text("swatch_hex").notNull(),
    imageUrl: text("image_url"),
    fabric: text("fabric").notNull(),
    stretchNote: text("stretch_note").notNull(),
    priceInr: integer("price_inr").notNull(),
    inventoryQty: integer("inventory_qty"),
    status: text("status").notNull().default("active"),
    moderationStatus: text("moderation_status")
      .notNull()
      .default("approved"),
    moderationReason: text("moderation_reason"),
    customFitEligible: boolean("custom_fit_eligible")
      .notNull()
      .default(false),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 })
      .notNull()
      .default("0.00"),
    reviewCount: integer("review_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("products_price_inr_check", sql`${table.priceInr} >= 0`),
    check(
      "products_status_check",
      sql`${table.status} IN ('draft', 'active', 'out_of_stock', 'inactive')`
    ),
    check(
      "products_moderation_status_check",
      sql`${table.moderationStatus} IN ('pending_review', 'approved', 'rejected', 'suspended')`
    ),
    index("products_status_moderation_category_idx").on(
      table.status,
      table.moderationStatus,
      table.category
    ),
  ]
);

export const garmentMeasurements = pgTable(
  "garment_measurements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    chestCm: numeric("chest_cm", { precision: 6, scale: 1 }).notNull(),
    waistCm: numeric("waist_cm", { precision: 6, scale: 1 }).notNull(),
    extraDimsCm: jsonb("extra_dims_cm"),
  },
  (table) => [
    uniqueIndex("garment_measurements_product_size_unique").on(
      table.productId,
      table.size
    ),
    check("garment_measurements_chest_positive", sql`${table.chestCm} > 0`),
    check("garment_measurements_waist_positive", sql`${table.waistCm} > 0`),
  ]
);

// =============================================================================
// 5. SHOPPING EXPERIENCE: SAVED LOOKS, WISHLIST & CART
// =============================================================================

export const savedLooks = pgTable(
  "saved_looks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    garmentIds: jsonb("garment_ids").notNull(),
    source: text("source").notNull().default("Style Studio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "saved_looks_source_check",
      sql`${table.source} IN ('Style Studio', 'Virtual Try-On')`
    ),
  ]
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.productId],
      name: "wishlist_items_pk",
    }),
  ]
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    selectedSize: text("selected_size").notNull(),
    quantity: integer("quantity").notNull().default(1),
    customfitRequestId: text("customfit_request_id"),
  },
  (table) => [
    check(
      "cart_items_quantity_bounds",
      sql`${table.quantity} >= 1 AND ${table.quantity} <= 10`
    ),
    uniqueIndex("cart_items_user_product_size_cf_unique").on(
      table.userId,
      table.productId,
      table.selectedSize,
      sql`COALESCE(${table.customfitRequestId}, 'standard')`
    ),
  ]
);

// =============================================================================
// 6. CUSTOMFIT BESPOKE TAILORING REQUESTS
// =============================================================================

export const customfitRequests = pgTable(
  "customfit_requests",
  {
    id: text("id").primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    tailorPartnerId: uuid("tailor_partner_id")
      .notNull()
      .references(() => partners.id),
    measurementsSnapshot: jsonb("measurements_snapshot").notNull(),
    fitPreference: text("fit_preference").notNull(),
    adjustmentAreas: jsonb("adjustment_areas").notNull(),
    notes: text("notes"),
    tailoringFeeInr: integer("tailoring_fee_inr").notNull(),
    quoteStatus: text("quote_status").notNull().default("pending"),
    quoteApproved: boolean("quote_approved").notNull().default(false),
    stage: text("stage").notNull().default("Pending Quote"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "customfit_requests_fee_check",
      sql`${table.tailoringFeeInr} >= 0`
    ),
  ]
);

// =============================================================================
// 7. CHECKOUT GROUPS, SPLIT ORDERS & ORDER LINE ITEMS
// =============================================================================

export const checkoutGroups = pgTable(
  "checkout_groups",
  {
    id: text("id").primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    grandTotalInr: integer("grand_total_inr").notNull(),
    paymentMode: text("payment_mode").notNull().default("demo"),
    paymentProvider: text("payment_provider"),
    paymentReference: text("payment_reference"),
    paymentStatus: text("payment_status").notNull().default("completed"),
    shippingAddress: text("shipping_address").notNull(),
    shippingCity: text("shipping_city").notNull(),
    shippingState: text("shipping_state").notNull(),
    shippingPincode: text("shipping_pincode").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "checkout_groups_grand_total_check",
      sql`${table.grandTotalInr} >= 0`
    ),
  ]
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    checkoutGroupId: text("checkout_group_id")
      .notNull()
      .references(() => checkoutGroups.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    fulfillmentType: text("fulfillment_type").notNull(),
    sellerPartnerId: uuid("seller_partner_id").references(() => partners.id),
    tailorPartnerId: uuid("tailor_partner_id").references(() => partners.id),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    shippingAddress: text("shipping_address").notNull(),
    shippingCity: text("shipping_city").notNull(),
    shippingState: text("shipping_state").notNull(),
    shippingPincode: text("shipping_pincode").notNull(),
    paymentLabel: text("payment_label").notNull().default("Demo Card"),
    totalInr: integer("total_inr").notNull(),
    allocatedAmountInr: integer("allocated_amount_inr").notNull(),
    refundedAmountInr: integer("refunded_amount_inr").notNull().default(0),
    stage: text("stage").notNull(),
    rejectionReason: text("rejection_reason"),
    cancelOrReturnReason: text("cancel_or_return_reason"),
    measurementsSnapshot: jsonb("measurements_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("orders_total_inr_check", sql`${table.totalInr} >= 0`),
    check(
      "orders_allocated_amount_check",
      sql`${table.allocatedAmountInr} >= 0`
    ),
    check(
      "orders_refunded_amount_check",
      sql`${table.refundedAmountInr} >= 0 AND ${table.refundedAmountInr} <= ${table.totalInr}`
    ),
    check(
      "orders_fulfillment_partition_check",
      sql`(${table.fulfillmentType} = 'standard' AND ${table.sellerPartnerId} IS NOT NULL AND ${table.tailorPartnerId} IS NULL) OR (${table.fulfillmentType} = 'customfit' AND ${table.tailorPartnerId} IS NOT NULL AND ${table.sellerPartnerId} IS NULL)`
    ),
    index("orders_checkout_group_idx").on(table.checkoutGroupId),
    index("orders_customer_created_idx").on(
      table.customerId,
      table.createdAt
    ),
    index("orders_fulfillment_seller_stage_idx").on(
      table.fulfillmentType,
      table.sellerPartnerId,
      table.stage
    ),
    index("orders_fulfillment_tailor_stage_idx").on(
      table.fulfillmentType,
      table.tailorPartnerId,
      table.stage
    ),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    sellerPartnerId: uuid("seller_partner_id")
      .notNull()
      .references(() => partners.id),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    selectedSize: text("selected_size").notNull(),
    garmentDimensionsSnapshot: jsonb("garment_dimensions_snapshot"),
    unitPriceInr: integer("unit_price_inr").notNull(),
    quantity: integer("quantity").notNull(),
    customfitRequestId: text("customfit_request_id").references(
      () => customfitRequests.id,
      { onDelete: "set null" }
    ),
    customfitNotes: text("customfit_notes"),
  },
  (table) => [
    check("order_items_unit_price_check", sql`${table.unitPriceInr} >= 0`),
    check("order_items_quantity_check", sql`${table.quantity} >= 1`),
  ]
);

// =============================================================================
// 8. VIRTUAL TRY-ON (VTON) JOBS
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
// 9. GOVERNANCE & INQUIRIES: AUDIT LOGS & CONTACT
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

// =============================================================================
// 10. DRIZZLE RELATIONS (TYPED QUERY BUILDER)
// =============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  roles: many(userRoles),
  sessions: many(sessions),
  accounts: many(accounts),
  bodyProfile: one(bodyProfiles, {
    fields: [users.id],
    references: [bodyProfiles.userId],
  }),
  measurementHistory: many(measurementHistory),
  avatars: many(avatars),
  partners: many(partners),
  savedLooks: many(savedLooks),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
  checkoutGroups: many(checkoutGroups),
  orders: many(orders),
  vtonJobs: many(vtonJobs),
  auditLogs: many(adminAuditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  granter: one(users, {
    fields: [userRoles.grantedBy],
    references: [users.id],
  }),
}));

export const avatarsRelations = relations(avatars, ({ one }) => ({
  user: one(users, {
    fields: [avatars.userId],
    references: [users.id],
  }),
}));

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

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(partners, {
    fields: [products.sellerPartnerId],
    references: [partners.id],
  }),
  measurements: many(garmentMeasurements),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  orderItems: many(orderItems),
  customfitRequests: many(customfitRequests),
}));

export const garmentMeasurementsRelations = relations(
  garmentMeasurements,
  ({ one }) => ({
    product: one(products, {
      fields: [garmentMeasurements.productId],
      references: [products.id],
    }),
  })
);

export const checkoutGroupsRelations = relations(
  checkoutGroups,
  ({ one, many }) => ({
    customer: one(users, {
      fields: [checkoutGroups.customerId],
      references: [users.id],
    }),
    orders: many(orders),
  })
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  checkoutGroup: one(checkoutGroups, {
    fields: [orders.checkoutGroupId],
    references: [checkoutGroups.id],
  }),
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  seller: one(partners, {
    fields: [orders.sellerPartnerId],
    references: [partners.id],
    relationName: "sellerOrders",
  }),
  tailor: one(partners, {
    fields: [orders.tailorPartnerId],
    references: [partners.id],
    relationName: "tailorOrders",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  seller: one(partners, {
    fields: [orderItems.sellerPartnerId],
    references: [partners.id],
  }),
  customfitRequest: one(customfitRequests, {
    fields: [orderItems.customfitRequestId],
    references: [customfitRequests.id],
  }),
}));
