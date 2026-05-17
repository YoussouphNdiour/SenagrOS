import type { ReactNode } from 'react'
import { ArrowLeft, MapPin, Layers } from 'lucide-react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { AppShell } from '../../../components/AppShell'
import type { ParcelleShowProps } from '../../../types/parcelle'

// Fix Leaflet default icon issue with Vite
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

function FitBounds({ geojson }: { geojson: string }) {
  const map = useMap()
  try {
    const data = JSON.parse(geojson)
    const layer = L.geoJSON(data)
    map.fitBounds(layer.getBounds(), { padding: [20, 20] })
  } catch {
    // ignore parse errors
  }
  return null
}

function ParcelleShow({ parcelle, productions }: ParcelleShowProps) {
  const stateLabel = (state: string): { label: string; bg: string; color: string } => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      opened:  { label: 'Ouverte',     bg: '#d1fae5', color: '#065f46' },
      closed:  { label: 'Clôturée',    bg: '#fee2e2', color: '#991b1b' },
      aborted: { label: 'Abandonnée',  bg: '#fef3c7', color: '#92400e' },
    }
    return map[state] ?? { label: state, bg: '#f3f4f6', color: '#374151' }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/cultivable-zones"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux parcelles
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {parcelle.name}
          </h1>
          {parcelle.work_number && (
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
              style={{
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              {parcelle.work_number}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={`/backend/cultivable-zones/${parcelle.id}/edit`}
            className="px-3 py-1.5 rounded text-sm font-medium no-underline"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            Modifier
          </a>
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-5"
        style={{ gridTemplateColumns: parcelle.geojson ? '1fr 1fr' : '1fr' }}
      >
        {/* Info card */}
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <MapPin size={14} /> Informations
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: 'Surface', value: parcelle.area_ha != null ? `${parcelle.area_ha} ha` : '—' },
              { label: 'Nature du sol', value: parcelle.soil_nature || '—' },
              { label: 'Système de production', value: parcelle.production_system_name || '—' },
              { label: 'Propriétaire', value: parcelle.owner_name || '—' },
              { label: 'Agriculteur', value: parcelle.farmer_name || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {parcelle.description && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Description
              </dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>
                {parcelle.description}
              </dd>
            </div>
          )}
        </div>

        {/* Map */}
        {parcelle.geojson && (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border)', height: '300px' }}
          >
            <MapContainer
              center={[14.5, -14.5]}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <GeoJSON
                data={JSON.parse(parcelle.geojson) as GeoJSON.GeoJsonObject}
                style={() => ({
                  color: '#1B6B3A',
                  weight: 2,
                  fillColor: '#4CAF72',
                  fillOpacity: 0.3,
                })}
              />
              <FitBounds geojson={parcelle.geojson} />
            </MapContainer>
          </div>
        )}
      </div>

      {/* Productions */}
      {productions.length > 0 && (
        <div
          className="mt-5 rounded-lg overflow-hidden"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <Layers size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Productions ({productions.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)' }}>
                {['Production', 'Début', 'Fin', 'État'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productions.map((p, i) => {
                const s = stateLabel(p.state)
                return (
                  <tr
                    key={p.id}
                    style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                      {p.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.started_on ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.stopped_on ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

ParcelleShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcelleShow
