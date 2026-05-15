import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { GeoJsonObject } from 'geojson'

// Leaflet ne supporte pas les CSS custom properties — valeurs miroir des tokens
const ZONE_STYLE = {
  color:       '#E8A020',   // --color-accent
  fillColor:   '#E8A020',
  fillOpacity: 0.25,
  weight:      2,
}

const DEFAULT_CENTER: [number, number] = [14.5, -14.5]  // Sénégal

interface InterventionMapProps {
  geojson: GeoJSON.FeatureCollection
}

export function InterventionMap({ geojson }: InterventionMapProps) {
  if (geojson.features.length === 0) {
    return (
      <div
        style={{
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding:      '24px',
          textAlign:    'center',
          color:        'var(--color-text-muted)',
          fontSize:     '13px',
        }}
      >
        Aucune zone géographique disponible pour les interventions affichées
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
        border:       '1px solid var(--color-border)',
        marginBottom: '16px',
      }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={8}
        style={{ height: '256px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojson.features.map((feature, i) => (
          <GeoJSON
            key={i}
            data={feature as GeoJsonObject}
            style={ZONE_STYLE}
          />
        ))}
      </MapContainer>
    </div>
  )
}
