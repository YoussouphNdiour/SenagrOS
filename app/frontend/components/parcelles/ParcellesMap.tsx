import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Parcelle } from '../../types/parcelle'

interface ParcellesMapProps {
  parcelles: Parcelle[]
  highlightId?: number | null
}

export function ParcellesMap({ parcelles, highlightId }: ParcellesMapProps) {
  const withGeo = parcelles.filter((p) => p.geojson !== null)

  return (
    <div className="h-[55vh] rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={[14.5, -14.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {withGeo.map((p) => (
          <GeoJSON
            key={p.id}
            data={JSON.parse(p.geojson as string)}
            style={{
              color: highlightId === p.id ? '#E8A020' : '#1B6B3A',
              weight: 2,
              fillOpacity: 0.3,
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
