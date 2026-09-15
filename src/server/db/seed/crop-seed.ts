import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../schema';
import { cropFamilies, crops, cropRotationRules } from '../schema';

/**
 * Seed crop families, crops, and rotation rules for Senegalese agriculture.
 * Call this function from the main seed script.
 */
export async function seedCrops(db: PostgresJsDatabase<typeof schema>) {
  console.log('Seeding crop families...');

  // --- Crop Families ---

  const families = [
    { code: 'FAB', name: 'Fabacées', description: 'Légumineuses (haricots, arachide, niébé)' },
    { code: 'SOL', name: 'Solanacées', description: 'Tomate, aubergine, piment, poivron' },
    { code: 'CUC', name: 'Cucurbitacées', description: 'Melon, pastèque, concombre, courge' },
    { code: 'POA', name: 'Poacées', description: 'Graminées (riz, mil, sorgho, maïs)' },
    { code: 'LIL', name: 'Liliacées', description: 'Oignon, ail, poireau' },
    { code: 'BRA', name: 'Brassicacées', description: 'Choux, navet, radis' },
    { code: 'MAL', name: 'Malvacées', description: 'Coton, gombo, bissap' },
    { code: 'ANA', name: 'Anacardiacées', description: 'Mangue, anacarde' },
  ];

  await db.insert(cropFamilies).values(families).onConflictDoNothing();

  // Fetch inserted families for FK references
  const insertedFamilies = await db.select().from(cropFamilies);
  const familyByCode = Object.fromEntries(
    insertedFamilies.map((f) => [f.code, f.id]),
  );

  console.log('Seeding crops...');

  // --- Crops ---

  const cropsData = [
    {
      code: 'HVT',
      nameFr: 'Haricot vert',
      nameEn: 'Green bean',
      nameWo: 'Bisaab',
      familyId: familyByCode['FAB'],
      cycleShortDays: 45,
      cycleLongDays: 90,
      seasonPreference: ['contre_saison_froide', 'contre_saison_chaude'],
    },
    {
      code: 'RIZ',
      nameFr: 'Riz',
      nameEn: 'Rice',
      nameWo: 'Maalo',
      familyId: familyByCode['POA'],
      cycleShortDays: 90,
      cycleLongDays: 150,
      seasonPreference: ['hivernage'],
    },
    {
      code: 'ARA',
      nameFr: 'Arachide',
      nameEn: 'Peanut',
      nameWo: 'Gerté',
      familyId: familyByCode['FAB'],
      cycleShortDays: 90,
      cycleLongDays: 120,
      seasonPreference: ['hivernage'],
    },
    {
      code: 'TOM',
      nameFr: 'Tomate',
      nameEn: 'Tomato',
      nameWo: 'Tamaate',
      familyId: familyByCode['SOL'],
      cycleShortDays: 60,
      cycleLongDays: 90,
      seasonPreference: ['contre_saison_froide'],
    },
    {
      code: 'OIG',
      nameFr: 'Oignon',
      nameEn: 'Onion',
      nameWo: 'Soble',
      familyId: familyByCode['LIL'],
      cycleShortDays: 120,
      cycleLongDays: 150,
      seasonPreference: ['contre_saison_froide'],
    },
    {
      code: 'MIL',
      nameFr: 'Mil',
      nameEn: 'Millet',
      nameWo: 'Dugar',
      familyId: familyByCode['POA'],
      cycleShortDays: 75,
      cycleLongDays: 120,
      seasonPreference: ['hivernage'],
    },
    {
      code: 'SOR',
      nameFr: 'Sorgho',
      nameEn: 'Sorghum',
      nameWo: 'Bassi',
      familyId: familyByCode['POA'],
      cycleShortDays: 90,
      cycleLongDays: 140,
      seasonPreference: ['hivernage'],
    },
    {
      code: 'NIE',
      nameFr: 'Niébé',
      nameEn: 'Cowpea',
      nameWo: 'Ñebbe',
      familyId: familyByCode['FAB'],
      cycleShortDays: 60,
      cycleLongDays: 90,
      seasonPreference: ['hivernage'],
    },
    {
      code: 'PAT',
      nameFr: 'Patate douce',
      nameEn: 'Sweet potato',
      nameWo: 'Pataas',
      familyId: undefined,
      cycleShortDays: 90,
      cycleLongDays: 150,
      seasonPreference: ['hivernage', 'contre_saison_froide', 'contre_saison_chaude'],
    },
    {
      code: 'MAN',
      nameFr: 'Mangue',
      nameEn: 'Mango',
      nameWo: 'Mango',
      familyId: familyByCode['ANA'],
      cycleShortDays: undefined,
      cycleLongDays: undefined,
      seasonPreference: [],
    },
    {
      code: 'COT',
      nameFr: 'Coton',
      nameEn: 'Cotton',
      nameWo: 'Owu',
      familyId: familyByCode['MAL'],
      cycleShortDays: 150,
      cycleLongDays: 180,
      seasonPreference: ['hivernage'],
    },
    {
      code: 'MAI',
      nameFr: 'Maïs',
      nameEn: 'Corn',
      nameWo: 'Mbaxal',
      familyId: familyByCode['POA'],
      cycleShortDays: 70,
      cycleLongDays: 120,
      seasonPreference: ['hivernage'],
    },
  ];

  await db.insert(crops).values(cropsData).onConflictDoNothing();

  // Fetch inserted crops for FK references
  const insertedCrops = await db.select().from(crops);
  const cropByCode = Object.fromEntries(
    insertedCrops.map((c) => [c.code, c.id]),
  );

  console.log('Seeding crop rotation rules...');

  // --- Rotation Rules (global, farmId = null) ---

  const rotationRules = [
    {
      previousCropId: cropByCode['ARA'],
      nextCropId: cropByCode['MIL'],
      compatibility: 'recommended' as const,
      reason: 'Fixation azote par arachide bénéfique pour le mil',
      recommendation: 'Rotation classique bassin arachidier',
    },
    {
      previousCropId: cropByCode['ARA'],
      nextCropId: cropByCode['SOR'],
      compatibility: 'recommended' as const,
      reason: 'Fixation azote par arachide bénéfique pour le sorgho',
    },
    {
      previousCropId: cropByCode['ARA'],
      nextCropId: cropByCode['MAI'],
      compatibility: 'recommended' as const,
      reason: 'Fixation azote par arachide bénéfique pour le maïs',
    },
    {
      previousCropId: cropByCode['NIE'],
      nextCropId: cropByCode['MIL'],
      compatibility: 'recommended' as const,
      reason: 'Fixation azote par niébé bénéfique pour le mil',
    },
    {
      previousCropId: cropByCode['TOM'],
      nextCropId: cropByCode['TOM'],
      compatibility: 'avoid' as const,
      reason: 'Accumulation nématodes et maladies telluriques',
      recommendation: 'Attendre 2-3 ans avant replantation tomate',
    },
    {
      previousCropId: cropByCode['RIZ'],
      nextCropId: cropByCode['OIG'],
      compatibility: 'recommended' as const,
      reason: 'Rotation classique vallée du fleuve Sénégal',
      recommendation: 'Oignon en contre-saison froide après riz hivernage',
    },
    {
      previousCropId: cropByCode['HVT'],
      nextCropId: cropByCode['HVT'],
      compatibility: 'avoid' as const,
      reason: 'Risque maladies racinaires (Fusarium, Rhizoctonia)',
      recommendation: 'Faire engrais vert intermédiaire ou rotation céréale',
    },
    {
      previousCropId: cropByCode['COT'],
      nextCropId: cropByCode['ARA'],
      compatibility: 'recommended' as const,
      reason: 'Rotation classique bassin arachidier, restauration azote',
    },
    {
      previousCropId: cropByCode['MIL'],
      nextCropId: cropByCode['ARA'],
      compatibility: 'recommended' as const,
      reason: 'Rotation céréale-légumineuse classique',
    },
  ];

  await db.insert(cropRotationRules).values(rotationRules).onConflictDoNothing();

  console.log('Crop seed complete.');
}
