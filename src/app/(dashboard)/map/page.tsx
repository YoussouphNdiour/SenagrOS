import dynamic from 'next/dynamic';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { farms } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const MapView = dynamic(
  () =>
    import('@/components/maps/MapView').then((m) => ({
      default: m.MapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-gray-500">
        Chargement de la carte...
      </div>
    ),
  },
);

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
      <h1 className="mb-4 text-2xl font-bold text-gray-800">
        Carte des parcelles
      </h1>
      <div className="h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-gray-200">
        <MapView farmLat={farmLat} farmLng={farmLng} />
      </div>
    </div>
  );
}
