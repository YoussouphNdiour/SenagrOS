#!/bin/sh
set -e

echo "Running database migrations..."
node -e "
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');

async function main() {
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './src/server/db/migrations' });
  console.log('Migrations complete.');
  await client.end();
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });
"

echo "Starting SenagrOS..."
exec node server.js
