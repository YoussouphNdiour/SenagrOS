import dynamic from 'next/dynamic';

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

export default function MapPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-800">
        Carte des parcelles
      </h1>
      <div className="h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-gray-200">
        <MapView />
      </div>
    </div>
  );
}
