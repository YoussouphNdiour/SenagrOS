import { useState } from 'react'
import { InterventionFilterPanel } from '../../../components/interventions/InterventionFilterPanel'
import { InterventionTable }       from '../../../components/interventions/InterventionTable'
import { InterventionKanban }      from '../../../components/interventions/InterventionKanban'
import { InterventionMap }         from '../../../components/interventions/InterventionMap'
import { useInterventionFilters }  from '../../../hooks/useInterventionFilters'
import type { InterventionIndexProps, InterventionFilters } from '../../../types/intervention'

type View = 'table' | 'kanban'

const TOGGLE_STYLE = (active: boolean) => ({
  padding:      '6px 16px',
  border:       '1px solid var(--color-border)',
  borderRadius: '4px',
  background:   active ? 'var(--color-primary)' : 'var(--color-bg-card)',
  color:        active ? '#fff' : 'var(--color-text)',
  cursor:       'pointer',
  fontWeight:   active ? 600 : 400,
  fontSize:     '13px',
})

export default function InterventionsIndex({
  interventions,
  kanban,
  map_geojson,
  filters,
  meta,
}: InterventionIndexProps) {
  const [view, setView]       = useState<View>('table')
  const [mapOpen, setMapOpen] = useState(false)
  const { applyFilters }      = useInterventionFilters(filters)

  const handleKanbanFilter = (patch: Partial<InterventionFilters>) => {
    applyFilters(patch)
    setView('table')
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '24px' }}>
      <h1
        style={{
          fontFamily:   'var(--font-heading)',
          fontSize:     '22px',
          fontWeight:   700,
          color:        'var(--color-text)',
          marginBottom: '16px',
        }}
      >
        Interventions
      </h1>

      <InterventionFilterPanel filters={filters} meta={meta} onChange={applyFilters} />

      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <button onClick={() => setView('table')}  style={TOGGLE_STYLE(view === 'table')}>Liste</button>
        <button onClick={() => setView('kanban')} style={TOGGLE_STYLE(view === 'kanban')}>Tableau</button>
        <button
          onClick={() => setMapOpen(v => !v)}
          style={TOGGLE_STYLE(mapOpen)}
        >
          Carte
        </button>
      </div>

      {mapOpen && <InterventionMap geojson={map_geojson} />}

      {view === 'table' && (
        <InterventionTable rows={interventions} meta={meta} onPage={applyFilters} />
      )}
      {view === 'kanban' && (
        <InterventionKanban counts={kanban} onFilter={handleKanbanFilter} />
      )}
    </div>
  )
}
