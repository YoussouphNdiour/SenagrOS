import { customType } from 'drizzle-orm/pg-core';

/**
 * PostGIS geometry column (SRID 4326 — WGS 84)
 *
 * Stores geometry as PostGIS native type.
 * Use ST_AsGeoJSON(geometry) in selects to get GeoJSON,
 * and ST_GeomFromGeoJSON(jsonString) in inserts to convert from GeoJSON.
 */
export const postgisGeometry = customType<{
  data: string | null;
  driverValue: string | null;
}>({
  dataType() {
    return 'geometry(Geometry, 4326)';
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return value as string | null;
  },
});
