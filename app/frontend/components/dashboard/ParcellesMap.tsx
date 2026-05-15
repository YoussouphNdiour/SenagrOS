import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { GeoJsonObject } from 'geojson'
import type { Parcelle } from '../../types/dashboard'

// Leaflet PathOptions do not accept CSS custom properties — values mirror design tokens
const LAYER_STYLE = {
  color: '#1B6B3A',      // --color-primary
  fillColor: '#4CAF72',  // --color-primary-light
  fillOpacity: 0.3,
  weight: 2,
}

function parseGeoJSON(raw: string): GeoJsonObject | null {
  try {
    return JSON.parse(raw) as GeoJsonObject
  } catch {
    return null
  }
}

interface ParcellesMapProps {
  parcelles: Parcelle[]
}

export function ParcellesMap({ parcelles }: ParcellesMapProps) {
  if (parcelles.length === 0) {
    return (
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '32px 20px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Aucune parcelle enregistrée</p>
        <a
          href="/backend/cultivable_zones/new"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            textDecoration: 'underline',
          }}
        >
          Créer une parcelle
        </a>
      </div>
    )
  }

  const defaultCenter: [number, number] = [14.5, -14.5]

  return (
    <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '280px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {parcelles.map((parcelle) => {
          const data = parseGeoJSON(parcelle.geojson)
          if (!data) return null
          return (
            <GeoJSON
              key={parcelle.id}
              data={data}
              style={LAYER_STYLE}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
