ALTER TABLE "garment_measurements" DROP CONSTRAINT "garment_measurements_chest_positive";--> statement-breakpoint
ALTER TABLE "garment_measurements" DROP CONSTRAINT "garment_measurements_waist_positive";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_seller_partner_id_partners_id_fk";
--> statement-breakpoint
ALTER TABLE "garment_measurements" ALTER COLUMN "chest_cm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "garment_measurements" ALTER COLUMN "waist_cm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "seller_partner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "garment_type" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_partner_id_partners_id_fk" FOREIGN KEY ("seller_partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_garment_type_idx" ON "products" USING btree ("garment_type");--> statement-breakpoint
ALTER TABLE "garment_measurements" ADD CONSTRAINT "garment_measurements_has_dimension" CHECK ("garment_measurements"."chest_cm" IS NOT NULL OR "garment_measurements"."waist_cm" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "garment_measurements" ADD CONSTRAINT "garment_measurements_chest_positive" CHECK ("garment_measurements"."chest_cm" IS NULL OR "garment_measurements"."chest_cm" > 0);--> statement-breakpoint
ALTER TABLE "garment_measurements" ADD CONSTRAINT "garment_measurements_waist_positive" CHECK ("garment_measurements"."waist_cm" IS NULL OR "garment_measurements"."waist_cm" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_garment_type_check" CHECK ("products"."garment_type" IS NULL OR "products"."garment_type" IN ('tshirt', 'shirt', 'trousers', 'kurti'));