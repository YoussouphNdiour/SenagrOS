CREATE TYPE "public"."asset_type" AS ENUM('land', 'plant', 'animal', 'equipment', 'structure', 'material', 'sensor', 'water', 'seed', 'product', 'compost', 'group');--> statement-breakpoint
CREATE TYPE "public"."inventory_adjustment" AS ENUM('increment', 'decrement', 'reset');--> statement-breakpoint
CREATE TYPE "public"."log_type" AS ENUM('activity', 'observation', 'input', 'harvest', 'seeding', 'transplanting', 'birth', 'maintenance', 'medical', 'lab_test', 'movement', 'irrigation');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'worker', 'viewer');--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"latitude" varchar(20),
	"longitude" varchar(20),
	"timezone" varchar(50) DEFAULT 'Africa/Dakar',
	"currency" varchar(3) DEFAULT 'XOF',
	"locale" varchar(5) DEFAULT 'fr',
	"season_type" varchar(20) DEFAULT 'hivernage',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"role" "user_role" DEFAULT 'worker',
	"farm_id" uuid,
	"locale" varchar(5) DEFAULT 'fr',
	"avatar_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "asset_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"parent_id" uuid,
	"farm_id" uuid NOT NULL,
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"flags" jsonb DEFAULT '[]'::jsonb,
	"is_location" boolean DEFAULT false,
	"is_fixed" boolean DEFAULT false,
	"id_tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "log_assets" (
	"log_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'subject',
	CONSTRAINT "log_assets_log_id_asset_id_pk" PRIMARY KEY("log_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "log_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"timestamp" timestamp with time zone NOT NULL,
	"farm_id" uuid NOT NULL,
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"flags" jsonb DEFAULT '[]'::jsonb,
	"is_movement" boolean DEFAULT false,
	"equipment_ids" jsonb DEFAULT '[]'::jsonb,
	"location_ids" jsonb DEFAULT '[]'::jsonb,
	"worker_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quantities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_id" uuid NOT NULL,
	"measure" varchar(20) NOT NULL,
	"numerator" bigint NOT NULL,
	"denominator" bigint DEFAULT 1,
	"unit" varchar(20) NOT NULL,
	"label" varchar(100),
	"inventory_adjustment" "inventory_adjustment",
	"inventory_asset_id" uuid
);
--> statement-breakpoint
CREATE TABLE "plan_logs" (
	"plan_id" uuid NOT NULL,
	"log_id" uuid NOT NULL,
	CONSTRAINT "plan_logs_plan_id_log_id_pk" PRIMARY KEY("plan_id","log_id")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"season" varchar(50),
	"start_date" date,
	"end_date" date,
	"farm_id" uuid NOT NULL,
	"notes" text,
	"flags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"log_id" uuid,
	"farm_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "taxonomies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"farm_id" uuid,
	"data" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(100),
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"data" jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "farm_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "farm_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "farm_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cooperative_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cooperative_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cooperative_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "cooperative_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cooperative_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member',
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooperatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"region" varchar(100),
	"type" varchar(50) DEFAULT 'cooperative',
	"created_by" uuid NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultural_calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"crop_type" varchar(100) NOT NULL,
	"variety" varchar(100),
	"stages" jsonb NOT NULL,
	"total_days" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parcel_calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"calendar_id" uuid NOT NULL,
	"sowing_date" date NOT NULL,
	"stage_statuses" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) DEFAULT 'active',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "observation_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_id" uuid NOT NULL,
	"form_type" varchar(50) NOT NULL,
	"asset_id" uuid NOT NULL,
	"crop_type" varchar(100),
	"variety" varchar(100),
	"observer_id" uuid NOT NULL,
	"supervisor_id" uuid,
	"observation_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"observed_surface_ha" numeric(10, 4),
	"form_data" jsonb NOT NULL,
	"calculated" jsonb DEFAULT '{}'::jsonb,
	"observer_remarks" text,
	"supervisor_remarks" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_assets" ADD CONSTRAINT "log_assets_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_assets" ADD CONSTRAINT "log_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantities" ADD CONSTRAINT "quantities_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quantities" ADD CONSTRAINT "quantities_inventory_asset_id_assets_id_fk" FOREIGN KEY ("inventory_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_logs" ADD CONSTRAINT "plan_logs_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_logs" ADD CONSTRAINT "plan_logs_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxonomies" ADD CONSTRAINT "taxonomies_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_invitations" ADD CONSTRAINT "farm_invitations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_invitations" ADD CONSTRAINT "farm_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_invitations" ADD CONSTRAINT "cooperative_invitations_cooperative_id_cooperatives_id_fk" FOREIGN KEY ("cooperative_id") REFERENCES "public"."cooperatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_invitations" ADD CONSTRAINT "cooperative_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_invitations" ADD CONSTRAINT "cooperative_invitations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_members" ADD CONSTRAINT "cooperative_members_cooperative_id_cooperatives_id_fk" FOREIGN KEY ("cooperative_id") REFERENCES "public"."cooperatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_members" ADD CONSTRAINT "cooperative_members_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperatives" ADD CONSTRAINT "cooperatives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_calendars" ADD CONSTRAINT "cultural_calendars_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_calendars" ADD CONSTRAINT "parcel_calendars_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_calendars" ADD CONSTRAINT "parcel_calendars_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_calendars" ADD CONSTRAINT "parcel_calendars_calendar_id_cultural_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."cultural_calendars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_forms" ADD CONSTRAINT "observation_forms_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_forms" ADD CONSTRAINT "observation_forms_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_forms" ADD CONSTRAINT "observation_forms_observer_id_users_id_fk" FOREIGN KEY ("observer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_forms" ADD CONSTRAINT "observation_forms_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logs_type_timestamp_idx" ON "logs" USING btree ("type","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "revisions_entity_revision_idx" ON "revisions" USING btree ("entity_type","entity_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "farm_members_farm_user_idx" ON "farm_members" USING btree ("farm_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cooperative_members_coop_farm_idx" ON "cooperative_members" USING btree ("cooperative_id","farm_id");