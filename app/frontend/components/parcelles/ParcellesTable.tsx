import type { Parcelle } from '../../types/parcelle'

interface ParcellesTableProps {
  parcelles: Parcelle[]
  highlightId?: number | null
  onRowClick?: (id: number) => void
}

export function ParcellesTable({ parcelles, highlightId, onRowClick }: ParcellesTableProps) {
  if (parcelles.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>
        Aucune parcelle enregistrée.{' '}
        <a href="/backend/cultivable-zones/new" style={{ color: 'var(--color-primary)' }}>
          Créer une parcelle
        </a>
      </p>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
          <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom</th>
          <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surface</th>
          <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {parcelles.map((p) => (
          <tr
            key={p.id}
            onClick={() => onRowClick?.(p.id)}
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: highlightId === p.id ? '#f0f7ec' : 'var(--color-bg-card)',
              cursor: onRowClick ? 'pointer' : 'default',
            }}
          >
            <td style={{ padding: '10px 12px', color: 'var(--color-text)', fontWeight: 500 }}>{p.name}</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{p.area_ha} ha</td>
            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
              <a href={`/backend/cultivable-zones/${p.id}`} style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>
                Voir
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
