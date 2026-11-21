CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_logs_target_type_check" CHECK ("admin_audit_logs"."target_type" IN ('partner', 'product', 'order', 'checkout_group', 'user'))
);
--> statement-breakpoint
CREATE TABLE "avatars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"avatar_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avatars_avatar_id_unique" UNIQUE("avatar_id")
);
--> statement-breakpoint
CREATE TABLE "body_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"height_cm" numeric(6, 1) NOT NULL,
	"weight_kg" numeric(5, 1),
	"body_type" text,
	"chest_cm" numeric(6, 1) NOT NULL,
	"waist_cm" numeric(6, 1) NOT NULL,
	"hip_cm" numeric(6, 1),
	"shoulder_cm" numeric(6, 1),
	"sleeve_cm" numeric(6, 1),
	"inseam_cm" numeric(6, 1),
	"fit_preference" text DEFAULT 'regular' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "body_profiles_height_check" CHECK ("body_profiles"."height_cm" >= 130.0 AND "body_profiles"."height_cm" <= 220.0),
	CONSTRAINT "body_profiles_chest_check" CHECK ("body_profiles"."chest_cm" >= 70.0 AND "body_profiles"."chest_cm" <= 150.0),
	CONSTRAINT "body_profiles_waist_check" CHECK ("body_profiles"."waist_cm" >= 55.0 AND "body_profiles"."waist_cm" <= 140.0),
	CONSTRAINT "body_profiles_fit_pref_check" CHECK ("body_profiles"."fit_preference" IN ('slim', 'regular', 'relaxed', 'oversized'))
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"selected_size" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"customfit_request_id" text,
	CONSTRAINT "cart_items_quantity_bounds" CHECK ("cart_items"."quantity" >= 1 AND "cart_items"."quantity" <= 10)
);
--> statement-breakpoint
CREATE TABLE "checkout_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"grand_total_inr" integer NOT NULL,
	"payment_mode" text DEFAULT 'demo' NOT NULL,
	"payment_provider" text,
	"payment_reference" text,
	"payment_status" text DEFAULT 'completed' NOT NULL,
	"shipping_address" text NOT NULL,
	"shipping_city" text NOT NULL,
	"shipping_state" text NOT NULL,
	"shipping_pincode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_groups_grand_total_check" CHECK ("checkout_groups"."grand_total_inr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customfit_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"tailor_partner_id" uuid NOT NULL,
	"measurements_snapshot" jsonb NOT NULL,
	"fit_preference" text NOT NULL,
	"adjustment_areas" jsonb NOT NULL,
	"notes" text,
	"tailoring_fee_inr" integer NOT NULL,
	"quote_status" text DEFAULT 'pending' NOT NULL,
	"quote_approved" boolean DEFAULT false NOT NULL,
	"stage" text DEFAULT 'Pending Quote' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customfit_requests_fee_check" CHECK ("customfit_requests"."tailoring_fee_inr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "garment_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text NOT NULL,
	"size" text NOT NULL,
	"chest_cm" numeric(6, 1) NOT NULL,
	"waist_cm" numeric(6, 1) NOT NULL,
	"extra_dims_cm" jsonb,
	CONSTRAINT "garment_measurements_chest_positive" CHECK ("garment_measurements"."chest_cm" > 0),
	CONSTRAINT "garment_measurements_waist_positive" CHECK ("garment_measurements"."waist_cm" > 0)
);
--> statement-breakpoint
CREATE TABLE "measurement_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chest_cm" numeric(6, 1) NOT NULL,
	"waist_cm" numeric(6, 1) NOT NULL,
	"note" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"full_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"seller_partner_id" uuid NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"selected_size" text NOT NULL,
	"garment_dimensions_snapshot" jsonb,
	"unit_price_inr" integer NOT NULL,
	"quantity" integer NOT NULL,
	"customfit_request_id" text,
	"customfit_notes" text,
	CONSTRAINT "order_items_unit_price_check" CHECK ("order_items"."unit_price_inr" >= 0),
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"checkout_group_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"fulfillment_type" text NOT NULL,
	"seller_partner_id" uuid,
	"tailor_partner_id" uuid,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"shipping_address" text NOT NULL,
	"shipping_city" text NOT NULL,
	"shipping_state" text NOT NULL,
	"shipping_pincode" text NOT NULL,
	"payment_label" text DEFAULT 'Demo Card' NOT NULL,
	"total_inr" integer NOT NULL,
	"allocated_amount_inr" integer NOT NULL,
	"refunded_amount_inr" integer DEFAULT 0 NOT NULL,
	"stage" text NOT NULL,
	"rejection_reason" text,
	"cancel_or_return_reason" text,
	"measurements_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_total_inr_check" CHECK ("orders"."total_inr" >= 0),
	CONSTRAINT "orders_allocated_amount_check" CHECK ("orders"."allocated_amount_inr" >= 0),
	CONSTRAINT "orders_refunded_amount_check" CHECK ("orders"."refunded_amount_inr" >= 0 AND "orders"."refunded_amount_inr" <= "orders"."total_inr"),
	CONSTRAINT "orders_fulfillment_partition_check" CHECK (("orders"."fulfillment_type" = 'standard' AND "orders"."seller_partner_id" IS NOT NULL AND "orders"."tailor_partner_id" IS NULL) OR ("orders"."fulfillment_type" = 'customfit' AND "orders"."tailor_partner_id" IS NOT NULL AND "orders"."seller_partner_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"verification_status" text DEFAULT 'pending_review' NOT NULL,
	"operational_status" text DEFAULT 'active' NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_type_check" CHECK ("partners"."type" IN ('seller', 'tailor')),
	CONSTRAINT "partners_verification_status_check" CHECK ("partners"."verification_status" IN ('pending_review', 'verified', 'rejected')),
	CONSTRAINT "partners_operational_status_check" CHECK ("partners"."operational_status" IN ('active', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_partner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"fit_type" text NOT NULL,
	"occasion" text NOT NULL,
	"color" text NOT NULL,
	"swatch_hex" text NOT NULL,
	"image_url" text,
	"fabric" text NOT NULL,
	"stretch_note" text NOT NULL,
	"price_inr" integer NOT NULL,
	"inventory_qty" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"moderation_status" text DEFAULT 'approved' NOT NULL,
	"moderation_reason" text,
	"custom_fit_eligible" boolean DEFAULT false NOT NULL,
	"rating_avg" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_inr_check" CHECK ("products"."price_inr" >= 0),
	CONSTRAINT "products_status_check" CHECK ("products"."status" IN ('draft', 'active', 'out_of_stock', 'inactive')),
	CONSTRAINT "products_moderation_status_check" CHECK ("products"."moderation_status" IN ('pending_review', 'approved', 'rejected', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "saved_looks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"garment_ids" jsonb NOT NULL,
	"source" text DEFAULT 'Style Studio' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_looks_source_check" CHECK ("saved_looks"."source" IN ('Style Studio', 'Virtual Try-On'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tailor_profiles" (
	"partner_id" uuid PRIMARY KEY NOT NULL,
	"specialties" text NOT NULL,
	"base_tailoring_fee_inr" integer NOT NULL,
	"turnaround_days" integer NOT NULL,
	"weekly_capacity_orders" integer NOT NULL,
	"accepting_custom_orders" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tailor_profiles_fee_check" CHECK ("tailor_profiles"."base_tailoring_fee_inr" >= 0),
	CONSTRAINT "tailor_profiles_turnaround_check" CHECK ("tailor_profiles"."turnaround_days" >= 1),
	CONSTRAINT "tailor_profiles_capacity_check" CHECK ("tailor_profiles"."weekly_capacity_orders" >= 1)
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_pk" PRIMARY KEY("user_id","role"),
	CONSTRAINT "user_roles_role_check" CHECK ("user_roles"."role" IN ('customer', 'seller', 'tailor', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"password_hash" text,
	"account_status" text DEFAULT 'active' NOT NULL,
	"phone" text,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_account_status_check" CHECK ("users"."account_status" IN ('active', 'disabled'))
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vton_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"source_image_key" text NOT NULL,
	"result_image_key" text,
	"provider" text DEFAULT 'idm-vton' NOT NULL,
	"mode" text DEFAULT 'fallback_demo' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"error_code" text,
	"raw_expires_at" timestamp with time zone NOT NULL,
	"result_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vton_jobs_mode_check" CHECK ("vton_jobs"."mode" IN ('live_ai', 'fallback_demo')),
	CONSTRAINT "vton_jobs_status_check" CHECK ("vton_jobs"."status" IN ('queued', 'processing', 'succeeded', 'failed', 'timed_out'))
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_items_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_profiles" ADD CONSTRAINT "body_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_groups" ADD CONSTRAINT "checkout_groups_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customfit_requests" ADD CONSTRAINT "customfit_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customfit_requests" ADD CONSTRAINT "customfit_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customfit_requests" ADD CONSTRAINT "customfit_requests_tailor_partner_id_partners_id_fk" FOREIGN KEY ("tailor_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garment_measurements" ADD CONSTRAINT "garment_measurements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_history" ADD CONSTRAINT "measurement_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_partner_id_partners_id_fk" FOREIGN KEY ("seller_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_customfit_request_id_customfit_requests_id_fk" FOREIGN KEY ("customfit_request_id") REFERENCES "public"."customfit_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_group_id_checkout_groups_id_fk" FOREIGN KEY ("checkout_group_id") REFERENCES "public"."checkout_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_partner_id_partners_id_fk" FOREIGN KEY ("seller_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tailor_partner_id_partners_id_fk" FOREIGN KEY ("tailor_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_partner_id_partners_id_fk" FOREIGN KEY ("seller_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_looks" ADD CONSTRAINT "saved_looks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tailor_profiles" ADD CONSTRAINT "tailor_profiles_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vton_jobs" ADD CONSTRAINT "vton_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vton_jobs" ADD CONSTRAINT "vton_jobs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_actor_idx" ON "admin_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "avatars_user_id_idx" ON "avatars" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_user_product_size_cf_unique" ON "cart_items" USING btree ("user_id","product_id","selected_size",COALESCE("customfit_request_id", 'standard'));--> statement-breakpoint
CREATE UNIQUE INDEX "garment_measurements_product_size_unique" ON "garment_measurements" USING btree ("product_id","size");--> statement-breakpoint
CREATE INDEX "measurement_history_user_idx" ON "measurement_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_checkout_group_idx" ON "orders" USING btree ("checkout_group_id");--> statement-breakpoint
CREATE INDEX "orders_customer_created_idx" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_fulfillment_seller_stage_idx" ON "orders" USING btree ("fulfillment_type","seller_partner_id","stage");--> statement-breakpoint
CREATE INDEX "orders_fulfillment_tailor_stage_idx" ON "orders" USING btree ("fulfillment_type","tailor_partner_id","stage");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_owner_type_unique" ON "partners" USING btree ("owner_user_id","type");--> statement-breakpoint
CREATE INDEX "products_status_moderation_category_idx" ON "products" USING btree ("status","moderation_status","category");--> statement-breakpoint
CREATE INDEX "vton_jobs_user_status_expiry_idx" ON "vton_jobs" USING btree ("user_id","status","raw_expires_at","result_expires_at");