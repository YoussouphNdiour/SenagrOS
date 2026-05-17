import type { Parcelle } from '../../types/parcelle'

interface ParcellesTableProps {
  parcelles: Parcelle[]
  highlightId?: number | null
  onRowClick?: (id: number) => void
}

export function ParcellesTable({ parcelles, highlightId, onRowClick }: ParcellesTableProps) {
  if (parcelles.length === 0) {
    return (
      <p className="text-center p-6" style={{ color: 'var(--color-text-muted)' }}>
        Aucune parcelle enregistrée.{' '}
        <a href="/backend/cultivable-zones/new" style={{ color: 'var(--color-primary)' }}>
          Créer une parcelle
        </a>
      </p>
    )
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
          <th className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Nom</th>
          <th className="px-3 py-2.5 text-right font-semibold text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Surface</th>
          <th className="px-3 py-2.5 text-center font-semibold text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {parcelles.map((p) => (
          <tr
            key={p.id}
            onClick={() => onRowClick?.(p.id)}
            className={onRowClick ? 'cursor-pointer' : 'cursor-default'}
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: highlightId === p.id ? '#f0f7ec' : 'var(--color-bg-card)',
            }}
          >
            <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</td>
            <td className="px-3 py-2.5 text-right" style={{ color: 'var(--color-text-muted)' }}>{p.area_ha != null ? `${p.area_ha} ha` : '—'}</td>
            <td className="px-3 py-2.5 text-center">
              <a href={`/backend/cultivable-zones/${p.id}`} className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                Voir
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
