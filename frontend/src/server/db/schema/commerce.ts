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
import { users } from "./auth";
import { partners } from "./partners";

// =============================================================================
// CATALOGUE, GARMENTS & SIZING SPECIFICATIONS
// =============================================================================

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sellerPartnerId: uuid("seller_partner_id")
      .references(() => partners.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    garmentType: text("garment_type"),
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
    check(
      "products_garment_type_check",
      sql`${table.garmentType} IS NULL OR ${table.garmentType} IN ('tshirt', 'shirt', 'trousers', 'kurti')`
    ),
    index("products_status_moderation_category_idx").on(
      table.status,
      table.moderationStatus,
      table.category
    ),
    index("products_garment_type_idx").on(table.garmentType),
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
    chestCm: numeric("chest_cm", { precision: 6, scale: 1 }),
    waistCm: numeric("waist_cm", { precision: 6, scale: 1 }),
    extraDimsCm: jsonb("extra_dims_cm"),
  },
  (table) => [
    uniqueIndex("garment_measurements_product_size_unique").on(
      table.productId,
      table.size
    ),
    check(
      "garment_measurements_chest_positive",
      sql`${table.chestCm} IS NULL OR ${table.chestCm} > 0`
    ),
    check(
      "garment_measurements_waist_positive",
      sql`${table.waistCm} IS NULL OR ${table.waistCm} > 0`
    ),
    check(
      "garment_measurements_has_dimension",
      sql`${table.chestCm} IS NOT NULL OR ${table.waistCm} IS NOT NULL`
    ),
  ]
);

// =============================================================================
// SAVED LOOKS, WISHLIST & CART
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
// CUSTOMFIT BESPOKE TAILORING REQUESTS
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
// CHECKOUT GROUPS, SPLIT ORDERS & ORDER LINE ITEMS
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
// RELATIONS
// =============================================================================

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
