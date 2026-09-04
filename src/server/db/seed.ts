import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  // Farm
  const farmId = uuidv4();
  await db.insert(schema.farms).values({
    id: farmId,
    name: 'SCL Diama',
    description: 'Société de Cultures Légumières - Station de Diama',
    latitude: '16.2167',
    longitude: '-16.4333',
    timezone: 'Africa/Dakar',
    currency: 'XOF',
    locale: 'fr',
    seasonType: 'hivernage',
  });

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const userId = uuidv4();
  await db.insert(schema.users).values({
    id: userId,
    email: 'admin@senagros.local',
    name: 'Administrateur',
    passwordHash,
    role: 'owner',
    farmId,
    locale: 'fr',
    isActive: true,
  });

  // Farm member
  await db.insert(schema.farmMembers).values({
    farmId,
    userId,
    role: 'owner',
  });

  // Taxonomies
  const taxonomies = [
    // Crop families
    { type: 'crop_family', name: 'Céréales', description: 'Mil, sorgho, maïs, riz' },
    { type: 'crop_family', name: 'Légumineuses', description: 'Arachide, niébé, haricot vert' },
    { type: 'crop_family', name: 'Maraîchage', description: 'Oignon, tomate, gombo, piment' },
    { type: 'crop_family', name: 'Fruits', description: 'Mangue, agrumes, banane' },

    // Seasons
    { type: 'season', name: 'Hivernage', description: 'Juin à Octobre — saison des pluies' },
    { type: 'season', name: 'Contre-saison chaude', description: 'Mars à Juin' },
    { type: 'season', name: 'Contre-saison froide', description: 'Novembre à Février' },

    // Input categories - Phyto
    { type: 'input_category', name: 'Herbicide', description: 'Produits phytosanitaires — désherbage' },
    { type: 'input_category', name: 'Fongicide', description: 'Produits phytosanitaires — maladies fongiques' },
    { type: 'input_category', name: 'Insecticide', description: 'Produits phytosanitaires — insectes ravageurs' },
    { type: 'input_category', name: 'Engrais minéral', description: 'Fertilisation — NPK, urée, DAP' },
    { type: 'input_category', name: 'Engrais organique', description: 'Fertilisation — compost, fumier' },
    { type: 'input_category', name: 'Semence certifiée', description: 'Semences — certifiées' },
    { type: 'input_category', name: 'Semence paysanne', description: 'Semences — traditionnelles' },

    // Pest types
    { type: 'pest_type', name: 'Chenilles frontalières', description: 'Lépidoptères ravageurs' },
    { type: 'pest_type', name: 'Pucerons', description: 'Aphididae' },
    { type: 'pest_type', name: 'Mouche blanche', description: 'Bemisia tabaci' },
    { type: 'pest_type', name: 'Thrips', description: 'Thysanoptères' },
    { type: 'pest_type', name: 'Acariens', description: 'Tetranychidae' },
    { type: 'pest_type', name: 'Nématodes', description: 'Vers du sol' },
    { type: 'pest_type', name: 'Mineuses', description: 'Liriomyza' },
    { type: 'pest_type', name: 'Noctuelles', description: 'Spodoptera' },

    // Disease types
    { type: 'disease_type', name: 'Mildiou', description: 'Oomycètes — humidité' },
    { type: 'disease_type', name: 'Oïdium', description: 'Champignon — poudre blanche' },
    { type: 'disease_type', name: 'Fusariose', description: 'Fusarium — flétrissement' },
    { type: 'disease_type', name: 'Bactériose', description: 'Infections bactériennes' },
    { type: 'disease_type', name: 'Virose', description: 'Virus transmis par vecteurs' },
    { type: 'disease_type', name: 'Anthracnose', description: 'Colletotrichum' },

    // Cultural stages
    { type: 'cultural_stage', name: 'Semis', description: 'Mise en terre des semences' },
    { type: 'cultural_stage', name: 'Levée', description: 'Émergence des plantules' },
    { type: 'cultural_stage', name: 'Tallage', description: 'Formation des talles (céréales)' },
    { type: 'cultural_stage', name: 'Montaison', description: 'Élongation de la tige' },
    { type: 'cultural_stage', name: 'Épiaison', description: 'Sortie de l\'épi' },
    { type: 'cultural_stage', name: 'Floraison', description: 'Période de floraison' },
    { type: 'cultural_stage', name: 'Fructification', description: 'Formation des fruits' },
    { type: 'cultural_stage', name: 'Maturité', description: 'Maturité physiologique' },
    { type: 'cultural_stage', name: 'Récolte', description: 'Période de récolte' },

    // Equipment types
    { type: 'equipment_type', name: 'Tracteur', description: 'Véhicule de traction' },
    { type: 'equipment_type', name: 'Semoir', description: 'Machine de semis' },
    { type: 'equipment_type', name: 'Pulvérisateur', description: 'Application phytosanitaire' },
    { type: 'equipment_type', name: 'Moissonneuse', description: 'Machine de récolte' },
    { type: 'equipment_type', name: 'Épandeur', description: 'Distribution d\'engrais' },
    { type: 'equipment_type', name: 'Bineuse', description: 'Travail du sol inter-rang' },
    { type: 'equipment_type', name: 'Charrue', description: 'Labour du sol' },
    { type: 'equipment_type', name: 'Gyrobroyeur', description: 'Broyage des résidus' },
  ];

  for (const tax of taxonomies) {
    await db.insert(schema.taxonomies).values({
      type: tax.type,
      name: tax.name,
      description: tax.description,
      farmId: null, // global taxonomies
    });
  }

  console.log('Seed complete!');
  console.log(`Farm: ${farmId}`);
  console.log('Admin: admin@senagros.local / admin123');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
