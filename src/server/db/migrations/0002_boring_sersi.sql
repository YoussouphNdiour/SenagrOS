CREATE TABLE "marketplace_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"buyer_farm_id" uuid NOT NULL,
	"seller_farm_id" uuid NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"delivery_address" text,
	"delivery_method" varchar(30),
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketplace_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"asset_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"photo_url" varchar(500),
	"price_per_kg" numeric(15, 2) NOT NULL,
	"quantity_available" numeric(15, 2) NOT NULL,
	"unit" varchar(20) DEFAULT 'kg',
	"location" varchar(255),
	"is_bio" boolean DEFAULT false,
	"is_published" boolean DEFAULT true,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_product_id_marketplace_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."marketplace_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_farm_id_farms_id_fk" FOREIGN KEY ("buyer_farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_seller_farm_id_farms_id_fk" FOREIGN KEY ("seller_farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketplace_orders_product_id_idx" ON "marketplace_orders" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "marketplace_orders_buyer_id_idx" ON "marketplace_orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "marketplace_orders_seller_farm_id_idx" ON "marketplace_orders" USING btree ("seller_farm_id");--> statement-breakpoint
CREATE INDEX "marketplace_orders_status_idx" ON "marketplace_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketplace_products_farm_id_idx" ON "marketplace_products" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "marketplace_products_category_idx" ON "marketplace_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "marketplace_products_is_published_idx" ON "marketplace_products" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_farm_idx" ON "notifications" USING btree ("farm_id");