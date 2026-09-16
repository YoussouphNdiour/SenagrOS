-- Enable PostGIS extension (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry columns
ALTER TABLE "farms" ADD COLUMN IF NOT EXISTS "boundary" geometry(Geometry, 4326);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "geometry" geometry(Geometry, 4326);
ALTER TABLE "logs" ADD COLUMN IF NOT EXISTS "geometry" geometry(Geometry, 4326);

-- Create spatial indexes for fast geo queries
CREATE INDEX IF NOT EXISTS "idx_farms_boundary" ON "farms" USING gist ("boundary");
CREATE INDEX IF NOT EXISTS "idx_assets_geometry" ON "assets" USING gist ("geometry");
CREATE INDEX IF NOT EXISTS "idx_logs_geometry" ON "logs" USING gist ("geometry");

-- Backfill: copy coordinates from data JSONB to geometry column for existing land assets
-- This converts data->'coordinates' (GeoJSON polygon coords) to PostGIS geometry
UPDATE "assets"
SET "geometry" = ST_SetSRID(ST_GeomFromGeoJSON(
  json_build_object(
    'type', 'Polygon',
    'coordinates', data->'coordinates'
  )::text
), 4326)
WHERE type = 'land'
  AND data->'coordinates' IS NOT NULL
  AND jsonb_typeof(data->'coordinates') = 'array'
  AND "geometry" IS NULL;
