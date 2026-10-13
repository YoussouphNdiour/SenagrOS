'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(
  () => import('@/components/maps/MapView').then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-gray-500">
        Chargement de la carte...
      </div>
    ),
  },
);

interface MapClientProps {
  farmLat?: number;
  farmLng?: number;
}

export function MapClient({ farmLat, farmLng }: MapClientProps) {
  return <MapView farmLat={farmLat} farmLng={farmLng} />;
}
