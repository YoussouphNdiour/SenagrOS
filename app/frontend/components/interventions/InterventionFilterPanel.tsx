import { useState, useEffect } from 'react'
import type { InterventionFilters } from '../../types/intervention'

interface InterventionFilterPanelProps {
  filters: InterventionFilters
  meta: { procedures: Array<{ label: string; value: string }> }
  onChange: (patch: Partial<InterventionFilters>) => void
}

const hasActive = (f: InterventionFilters) =>
  !!(f.q || f.state?.length || f.nature?.length || f.procedure_name_id?.length)

export function InterventionFilterPanel({ filters, meta, onChange }: InterventionFilterPanelProps) {
  const [textValue, setTextValue] = useState(filters.q ?? '')

  // Debounce 300ms sur la recherche texte
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textValue !== (filters.q ?? '')) {
        onChange({ q: textValue || undefined, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [textValue])

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        placeholder="Rechercher..."
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '6px 10px',
          fontSize: '13px',
          color: 'var(--color-text)',
          minWidth: '180px',
        }}
      />

      <label htmlFor="filter-state" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        État
        <select
          id="filter-state"
          aria-label="État"
          value={filters.state?.[0] ?? ''}
          onChange={e =>
            onChange({ state: e.target.value ? [e.target.value] : undefined, page: 1 })
          }
          style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px' }}
        >
          <option value="">Tous</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
          <option value="validated">Validé</option>
          <option value="rejected">Rejeté</option>
        </select>
      </label>

      <label htmlFor="filter-nature" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        Nature
        <select
          id="filter-nature"
          aria-label="Nature"
          value={filters.nature?.[0] ?? ''}
          onChange={e =>
            onChange({ nature: e.target.value ? [e.target.value] : undefined, page: 1 })
          }
          style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px' }}
        >
          <option value="">Toutes</option>
          <option value="request">Planifiée</option>
          <option value="record">Réalisée</option>
        </select>
      </label>

      <label htmlFor="filter-procedure" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        Procédure
        <select
          id="filter-procedure"
          aria-label="Procédure"
          value={filters.procedure_name_id?.[0] ?? ''}
          onChange={e =>
            onChange({ procedure_name_id: e.target.value ? [e.target.value] : undefined, page: 1 })
          }
          style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px' }}
        >
          <option value="">Toutes</option>
          {meta.procedures.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>

      {hasActive(filters) && (
        <button
          onClick={() =>
            onChange({ q: undefined, state: undefined, nature: undefined, procedure_name_id: undefined, page: 1 })
          }
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          Réinitialiser
        </button>
      )}
    </div>
  )
}
