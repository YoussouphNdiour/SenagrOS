import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { seedStorefront } from './seed/storefront-seed';

/** Adds the Phase 13 storefront demo data to an already-seeded database. */
async function main() {
  const client = postgres(process.env.DATABASE_URL ?? '', { max: 1 });
  const db = drizzle(client, { schema });
  const [admin] = await db
    .select({ id: schema.users.id, farmId: schema.users.farmId })
    .from(schema.users)
    .where(eq(schema.users.email, 'admin@senagros.local'))
    .limit(1);
  if (!admin?.farmId) throw new Error('Run pnpm db:seed first (admin@senagros.local not found)');
  await seedStorefront(db, admin.farmId, admin.id);
  console.log('Storefront seed complete');
  await client.end();
}

main().catch((err) => {
  console.error('Storefront seed failed:', err);
  process.exit(1);
});
