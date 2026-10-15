import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { farms } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { MapClient } from '@/components/maps/MapClient';
import { NdviDropCheckButton } from '@/components/maps/NdviDropCheckButton';

export default async function MapPage() {
  const session = await auth();
  let farmLat: number | undefined;
  let farmLng: number | undefined;

  if (session?.user?.farmId) {
    const [farm] = await db
      .select({ latitude: farms.latitude, longitude: farms.longitude })
      .from(farms)
      .where(eq(farms.id, session.user.farmId))
      .limit(1);

    farmLat = farm?.latitude ? parseFloat(farm.latitude) : undefined;
    farmLng = farm?.longitude ? parseFloat(farm.longitude) : undefined;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Carte des parcelles</h1>
        <NdviDropCheckButton />
      </div>
      <div className="h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-gray-200">
        <MapClient farmLat={farmLat} farmLng={farmLng} />
      </div>
    </div>
  );
}
