ALTER TYPE "public"."user_role" ADD VALUE 'buyer';--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"buyer_type" varchar(30) NOT NULL,
	"company_name" varchar(255),
	"contact_name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"address" text NOT NULL,
	"city" varchar(100),
	"region" varchar(100),
	"ninea" varchar(20),
	"payment_preference" varchar(30) DEFAULT 'cod',
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "buyer_profiles_user_id_unique" UNIQUE("user_id")
);--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"region" varchar(100) NOT NULL,
	"department" varchar(100),
	"delivery_fee" numeric(15, 2) DEFAULT '0' NOT NULL,
	"min_order_amount" numeric(15, 2) DEFAULT '0',
	"estimated_days" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total_price" numeric(15, 2) NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"buyer_profile_id" uuid NOT NULL,
	"seller_farm_id" uuid NOT NULL,
	"delivery_zone_id" uuid,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"delivery_fee" numeric(15, 2) DEFAULT '0',
	"total_amount" numeric(15, 2) NOT NULL,
	"payment_method" varchar(30) NOT NULL,
	"payment_status" varchar(20) DEFAULT 'pending',
	"payment_reference" varchar(255),
	"delivery_address" text NOT NULL,
	"delivery_city" varchar(100),
	"delivery_region" varchar(100),
	"delivery_phone" varchar(30),
	"delivery_notes" text,
	"estimated_delivery" date,
	"delivered_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);--> statement-breakpoint
CREATE TABLE "price_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"buyer_type" varchar(30) NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"min_quantity" numeric(15, 2) DEFAULT '1',
	"max_quantity" numeric(15, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE "product_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"asset_id" uuid,
	"marketplace_product_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"subcategory" varchar(100),
	"photos" jsonb DEFAULT '[]'::jsonb,
	"base_price" numeric(15, 2) NOT NULL,
	"unit" varchar(20) DEFAULT 'kg',
	"min_order_quantity" numeric(15, 2) DEFAULT '1',
	"stock_available" numeric(15, 2) NOT NULL,
	"origin_region" varchar(100),
	"is_bio" boolean DEFAULT false,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"harvest_date" date,
	"shelf_life_days" integer,
	"is_published" boolean DEFAULT true,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"archived_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"buyer_profile_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"seller_response" text,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listing_id_product_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."product_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_profile_id_buyer_profiles_id_fk" FOREIGN KEY ("buyer_profile_id") REFERENCES "public"."buyer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_farm_id_farms_id_fk" FOREIGN KEY ("seller_farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_listing_id_product_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."product_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_marketplace_product_fk" FOREIGN KEY ("marketplace_product_id") REFERENCES "public"."marketplace_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_product_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."product_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_profile_id_buyer_profiles_id_fk" FOREIGN KEY ("buyer_profile_id") REFERENCES "public"."buyer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buyer_profiles_user_id_idx" ON "buyer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buyer_profiles_buyer_type_idx" ON "buyer_profiles" USING btree ("buyer_type");--> statement-breakpoint
CREATE INDEX "buyer_profiles_region_idx" ON "buyer_profiles" USING btree ("region");--> statement-breakpoint
CREATE INDEX "delivery_zones_farm_id_idx" ON "delivery_zones" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "delivery_zones_region_idx" ON "delivery_zones" USING btree ("region");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_listing_id_idx" ON "order_items" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_profile_id_idx" ON "orders" USING btree ("buyer_profile_id");--> statement-breakpoint
CREATE INDEX "orders_seller_farm_id_idx" ON "orders" USING btree ("seller_farm_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "price_tiers_listing_buyer_type_uniq" ON "price_tiers" USING btree ("listing_id","buyer_type");--> statement-breakpoint
CREATE INDEX "product_listings_farm_id_idx" ON "product_listings" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "product_listings_category_idx" ON "product_listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "product_listings_is_published_idx" ON "product_listings" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "product_listings_origin_region_idx" ON "product_listings" USING btree ("origin_region");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_order_listing_uniq" ON "reviews" USING btree ("order_id","listing_id");--> statement-breakpoint
CREATE INDEX "reviews_listing_id_idx" ON "reviews" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "reviews_buyer_profile_id_idx" ON "reviews" USING btree ("buyer_profile_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");
