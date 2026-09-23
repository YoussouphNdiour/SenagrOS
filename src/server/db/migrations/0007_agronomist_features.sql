-- Feature 1: Plans d'entretien PV — link plans to parcel and crop asset
ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "parcel_id" uuid REFERENCES "assets"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "crop_asset_id" uuid REFERENCES "assets"("id") ON DELETE SET NULL;

-- Feature 1: planned_tasks — growth stage + recurrence
ALTER TABLE "planned_tasks"
  ADD COLUMN IF NOT EXISTS "growth_stage" varchar(100),
  ADD COLUMN IF NOT EXISTS "recurrence_type" varchar(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "recurrence_interval_days" integer;

-- Feature 3: parcel_calendars — expected yield
ALTER TABLE "parcel_calendars"
  ADD COLUMN IF NOT EXISTS "expected_yield_kg_ha" integer;

-- Feature 4: Indicateurs personnalisés — KPI definitions
CREATE TABLE IF NOT EXISTS "farm_kpi_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "farm_id" uuid NOT NULL REFERENCES "farms"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "unit" varchar(50),
  "value_type" varchar(20) DEFAULT 'number',
  "category" varchar(50) DEFAULT 'autre',
  "target_value" numeric(12, 3),
  "flags" jsonb DEFAULT '[]',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "farm_kpi_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "farm_id" uuid NOT NULL REFERENCES "farms"("id") ON DELETE CASCADE,
  "kpi_id" uuid NOT NULL REFERENCES "farm_kpi_definitions"("id") ON DELETE CASCADE,
  "value" numeric(12, 3) NOT NULL,
  "measured_at" varchar(10) NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "farm_kpi_definitions_farm_idx" ON "farm_kpi_definitions" ("farm_id");
CREATE INDEX IF NOT EXISTS "farm_kpi_values_kpi_idx" ON "farm_kpi_values" ("kpi_id");
CREATE INDEX IF NOT EXISTS "farm_kpi_values_farm_idx" ON "farm_kpi_values" ("farm_id");
