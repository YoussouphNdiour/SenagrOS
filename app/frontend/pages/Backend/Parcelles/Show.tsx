import type { ReactNode } from 'react'
import { MapPin, Layers } from 'lucide-react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, CodeBadge, PrimaryButton, DataTable } from '../../../components/ui'
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

const PRODUCTION_STATE: Record<string, { label: string; bg: string; color: string }> = {
  opened:  { label: 'Ouverte',    bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  closed:  { label: 'Clôturée',   bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)' },
  aborted: { label: 'Abandonnée', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
}

function ParcelleShow({ parcelle, productions }: ParcelleShowProps) {
  return (
    <>
      <BackLink href="/backend/cultivable-zones" label="Retour aux parcelles" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold mb-2 m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {parcelle.name}
          </h1>
          {parcelle.work_number && (
            <CodeBadge value={parcelle.work_number} />
          )}
        </div>
        <PrimaryButton href={`/backend/cultivable-zones/${parcelle.id}/edit`} variant="secondary">Modifier</PrimaryButton>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: parcelle.geojson ? '1fr 1fr' : '1fr' }}>
        <SectionCard>
          <SectionTitle icon={MapPin}>Informations</SectionTitle>
          <DetailRow items={[
            { label: 'Surface',                 value: parcelle.area_ha != null ? `${parcelle.area_ha} ha` : '—' },
            { label: 'Nature du sol',           value: parcelle.soil_nature || '—' },
            { label: 'Système de production',   value: parcelle.production_system_name || '—' },
            { label: 'Propriétaire',            value: parcelle.owner_name || '—' },
            { label: 'Agriculteur',             value: parcelle.farmer_name || '—' },
            ...(parcelle.description ? [{ label: 'Description', value: parcelle.description, fullWidth: true }] : []),
          ]} />
        </SectionCard>

        {parcelle.geojson && (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)', height: '300px' }}>
            <MapContainer center={[14.5, -14.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <GeoJSON
                data={JSON.parse(parcelle.geojson) as GeoJSON.GeoJsonObject}
                style={() => ({ color: '#1B6B3A', weight: 2, fillColor: '#4CAF72', fillOpacity: 0.3 })}
              />
              <FitBounds geojson={parcelle.geojson} />
            </MapContainer>
          </div>
        )}
      </div>

      {productions.length > 0 && (
        <SectionCard className="mt-5">
          <SectionTitle icon={Layers}>Productions ({productions.length})</SectionTitle>
          <DataTable
            columns={[
              { key: 'name',   label: 'Production' },
              { key: 'debut',  label: 'Début' },
              { key: 'fin',    label: 'Fin' },
              { key: 'state',  label: 'État' },
            ]}
            data={productions}
            renderRow={(p, i) => {
              const s = PRODUCTION_STATE[p.state] ?? { label: p.state, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }
              return (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>
                  <td className="px-3 py-3 font-medium text-sm" style={{ color: 'var(--color-text)' }}>{p.name}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.started_on ?? '—'}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.stopped_on ?? '—'}</td>
                  <td className="px-3 py-3">
                    <StateBadge label={s.label} color={s.color} bg={s.bg} dot={false} />
                  </td>
                </tr>
              )
            }}
          />
        </SectionCard>
      )}
    </>
  )
}

ParcelleShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcelleShow
