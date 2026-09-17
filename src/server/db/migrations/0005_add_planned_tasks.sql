CREATE TABLE IF NOT EXISTS "planned_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "plan_id" uuid NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "type" varchar(50),
  "day_offset" integer DEFAULT 0,
  "planned_date" timestamp with time zone,
  "duration" integer,
  "status" varchar(20) DEFAULT 'planned',
  "inputs" jsonb DEFAULT '[]',
  "notes" text,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "planned_tasks_plan_id_idx" ON "planned_tasks" ("plan_id");
CREATE INDEX IF NOT EXISTS "planned_tasks_sort_order_idx" ON "planned_tasks" ("plan_id", "sort_order");
