#!/usr/bin/env node
/**
 * Imports the storefront catalogue of a farm (listings with their 3-level
 * price grid, delivery zones) from src/server/db/seed/storefront-catalogue.json.
 *
 * Meant for production: unlike `pnpm db:seed`, it creates NO demo accounts
 * and NO demo farm. It only adds what is missing (matched by name), so it can
 * be run several times safely. Everything happens in one transaction.
 *
 * Usage (inside the app container, DATABASE_URL already set):
 *   node scripts/import-catalogue.mjs --dry-run      # show what would change
 *   node scripts/import-catalogue.mjs                # apply
 *   node scripts/import-catalogue.mjs --farm "Nom de la ferme"
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const here = dirname(fileURLToPath(import.meta.url));
const catalogue = JSON.parse(
  readFileSync(join(here, '../src/server/db/seed/storefront-catalogue.json'), 'utf8'),
);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const farmArg = args.indexOf('--farm');
const farmName = farmArg >= 0 ? args[farmArg + 1] : catalogue.farm;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquant.');
  process.exit(1);
}
if (!farmName) {
  console.error('Nom de ferme manquant (--farm "Nom").');
  process.exit(1);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Thrown inside the transaction to roll back a dry run. */
class DryRun extends Error {}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const farms = await sql`select id, name from farms where name = ${farmName}`;
  if (farms.length !== 1) {
    throw new Error(
      farms.length === 0
        ? `Ferme « ${farmName} » introuvable.`
        : `Plusieurs fermes nommées « ${farmName} » : précisez-la dans la base.`,
    );
  }
  const farm = farms[0];
  const sellers = await sql`
    select id, email from users
    where farm_id = ${farm.id} and role in ('owner', 'manager') and is_active
    order by case role when 'owner' then 0 else 1 end, created_at
    limit 1`;
  if (sellers.length === 0) {
    throw new Error(`Aucun propriétaire ou gérant actif pour « ${farm.name} ».`);
  }
  const seller = sellers[0];

  const report = { listings: [], skippedListings: [], zones: [], skippedZones: [], photos: 0 };

  await sql
    .begin(async (tx) => {
      for (const l of catalogue.listings) {
        const [existing] = await tx`
          select id from product_listings
          where farm_id = ${farm.id} and name = ${l.name} and archived_at is null`;
        if (existing) {
          report.skippedListings.push(l.name);
          continue;
        }
        const photos = [{ url: `/storefront/photos/${l.slug}.jpg`, alt: l.name, order: 0 }];
        const [listing] = await tx`
          insert into product_listings (
            farm_id, seller_id, name, description, category, photos, base_price, unit,
            min_order_quantity, stock_available, origin_region, is_bio, certifications,
            harvest_date, shelf_life_days, is_published
          ) values (
            ${farm.id}, ${seller.id}, ${l.name}, ${l.description}, ${l.category},
            ${tx.json(photos)}, ${l.prices[0]}, ${l.unit}, ${l.minOrder}, ${l.stock},
            ${l.region}, ${l.bio ?? false}, ${tx.json(l.bio ? ['bio'] : [])},
            ${daysAgo(l.harvestedDaysAgo)}, ${l.shelfLife}, true
          ) returning id`;
        await tx`
          insert into price_tiers (listing_id, buyer_type, price, min_quantity) values
            (${listing.id}, 'particulier', ${l.prices[0]}, ${l.minOrder}),
            (${listing.id}, 'superette', ${l.prices[1]}, ${l.mins[0]}),
            (${listing.id}, 'grande_surface', ${l.prices[2]}, ${l.mins[1]})`;
        report.listings.push(l.name);
      }

      for (const z of catalogue.zones) {
        const [existing] = await tx`
          select id from delivery_zones where farm_id = ${farm.id} and name = ${z.name}`;
        if (existing) {
          report.skippedZones.push(z.name);
          continue;
        }
        await tx`
          insert into delivery_zones (
            farm_id, name, region, department, delivery_fee, min_order_amount, estimated_days
          ) values (
            ${farm.id}, ${z.name}, ${z.region}, ${z.department}, ${z.fee}, ${z.min}, ${z.days}
          )`;
        report.zones.push(z.name);
      }

      // Listings created with the former SVG placeholders now use the photos
      const remapped = await tx`
        update product_listings
        set photos = replace(replace(photos::text, '/storefront/products/', '/storefront/photos/'), '.svg', '.jpg')::jsonb
        where farm_id = ${farm.id}
          and photos::text like '%/storefront/products/%'
          and photos::text not like '%placeholder.svg%'
        returning id`;
      report.photos = remapped.length;

      if (dryRun) throw new DryRun();
    })
    .catch((err) => {
      if (!(err instanceof DryRun)) throw err;
    });

  console.log(`${dryRun ? '[SIMULATION] ' : ''}Ferme : ${farm.name} (vendeur : ${seller.email})`);
  console.log(`Produits ajoutés (${report.listings.length}) : ${report.listings.join(', ') || '—'}`);
  console.log(`Produits déjà présents (${report.skippedListings.length}) : ${report.skippedListings.join(', ') || '—'}`);
  console.log(`Zones ajoutées (${report.zones.length}) : ${report.zones.join(', ') || '—'}`);
  console.log(`Zones déjà présentes (${report.skippedZones.length}) : ${report.skippedZones.join(', ') || '—'}`);
  console.log(`Photos remplacées (anciens SVG) : ${report.photos}`);
  if (dryRun) console.log('Aucune modification enregistrée (--dry-run).');
} catch (err) {
  console.error(`Import annulé : ${err.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
