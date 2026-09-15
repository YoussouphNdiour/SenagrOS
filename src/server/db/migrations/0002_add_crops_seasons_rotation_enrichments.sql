CREATE TYPE "public"."rotation_compatibility" AS ENUM('recommended', 'neutral', 'avoid', 'forbidden');--> statement-breakpoint
CREATE TYPE "public"."season_type" AS ENUM('hivernage', 'contre_saison_chaude', 'contre_saison_froide');--> statement-breakpoint
CREATE TABLE "crop_families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "crop_families_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name_fr" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"name_wo" varchar(100),
	"family_id" uuid,
	"cycle_short_days" integer,
	"cycle_long_days" integer,
	"season_preference" jsonb DEFAULT '[]'::jsonb,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "crops_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "crop_varieties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"cycle_days" integer,
	"yield_potential_kg_ha" integer,
	"characteristics" jsonb DEFAULT '{}'::jsonb,
	"origin" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "crop_varieties_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "season_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"year" integer NOT NULL,
	"status" varchar(20) DEFAULT 'planning',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crop_rotation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid,
	"previous_crop_id" uuid NOT NULL,
	"next_crop_id" uuid NOT NULL,
	"compatibility" "rotation_compatibility" NOT NULL,
	"reason" text,
	"min_interval_days" integer,
	"recommendation" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "notifications" CASCADE;--> statement-breakpoint
ALTER TABLE "parcel_calendars" ADD COLUMN "expected_harvest_date" date;--> statement-breakpoint
ALTER TABLE "parcel_calendars" ADD COLUMN "actual_harvest_date" date;--> statement-breakpoint
ALTER TABLE "crops" ADD CONSTRAINT "crops_family_id_crop_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."crop_families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_varieties" ADD CONSTRAINT "crop_varieties_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_rotation_rules" ADD CONSTRAINT "crop_rotation_rules_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_rotation_rules" ADD CONSTRAINT "crop_rotation_rules_previous_crop_id_crops_id_fk" FOREIGN KEY ("previous_crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_rotation_rules" ADD CONSTRAINT "crop_rotation_rules_next_crop_id_crops_id_fk" FOREIGN KEY ("next_crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;