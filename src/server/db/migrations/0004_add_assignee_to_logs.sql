ALTER TABLE "logs" ADD COLUMN IF NOT EXISTS "assignee_id" uuid REFERENCES "users"("id");
CREATE INDEX IF NOT EXISTS "idx_logs_assignee_id" ON "logs" ("assignee_id");
