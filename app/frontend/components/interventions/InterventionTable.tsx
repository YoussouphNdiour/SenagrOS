import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { Intervention, InterventionFilters } from '../../types/intervention'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done:        'Terminé',
  validated:   'Validé',
  rejected:    'Rejeté',
}

// Leaflet ne supporte pas les CSS vars — même principe ici pour la cohérence
const STATE_COLORS: Record<string, string> = {
  in_progress: '#D4841A',
  done:        '#2D7A3A',
  validated:   '#1B6B3A',
  rejected:    '#D4420A',
}

const columnHelper = createColumnHelper<Intervention>()

const formatDate = (isoString: string): string => {
  const d = new Date(isoString)
  const day   = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year  = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

const columns = [
  columnHelper.accessor('name', {
    header: 'Nom',
    cell: info => (
      <a
        href={`/backend/interventions/${info.row.original.id}`}
        style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
      >
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor('human_activities_names', { header: 'Activités' }),
  columnHelper.accessor('started_at', {
    header: 'Début',
    cell: info => formatDate(info.getValue()),
  }),
  columnHelper.accessor('human_working_duration', { header: 'Durée' }),
  columnHelper.accessor('state', {
    header: 'État',
    cell: info => {
      const state = info.getValue()
      return (
        <span
          style={{
            background:   STATE_COLORS[state] ?? '#6B5E4E',
            color:        '#fff',
            borderRadius: '4px',
            padding:      '2px 8px',
            fontSize:     '12px',
            fontWeight:   600,
          }}
        >
          {STATE_LABELS[state] ?? state}
        </span>
      )
    },
  }),
  columnHelper.accessor('human_target_names', { header: 'Cibles' }),
  columnHelper.accessor('human_working_zone_area', { header: 'Surface' }),
]

interface InterventionTableProps {
  rows: Intervention[]
  meta: { total: number; page: number; per_page: number }
  onPage: (patch: Partial<InterventionFilters>) => void
}

export function InterventionTable({ rows, meta, onPage }: InterventionTableProps) {
  const table = useReactTable({
    data:            rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages  = Math.ceil(meta.total / meta.per_page)
  const isFirstPage = meta.page <= 1
  const isLastPage  = meta.page >= totalPages

  if (rows.length === 0) {
    return (
      <div
        style={{
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding:      '40px',
          textAlign:    'center',
          color:        'var(--color-text-muted)',
        }}
      >
        Aucune intervention trouvée
      </div>
    )
  }

  return (
    <div
      style={{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  style={{
                    padding:       '10px 12px',
                    textAlign:     'left',
                    fontSize:      '12px',
                    fontWeight:    600,
                    color:         'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                background:   i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)',
              }}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--color-text)' }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '10px 16px',
          borderTop:      '1px solid var(--color-border)',
          fontSize:       '13px',
          color:          'var(--color-text-muted)',
        }}
      >
        <span>{meta.total} résultat{meta.total > 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onPage({ page: meta.page - 1 })}
            disabled={isFirstPage}
            style={{
              padding:      '4px 10px',
              border:       '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor:       isFirstPage ? 'not-allowed' : 'pointer',
              background:   'var(--color-bg-card)',
              color:        isFirstPage ? 'var(--color-border)' : 'var(--color-text)',
            }}
          >
            Précédent
          </button>
          <span style={{ lineHeight: '30px' }}>
            Page {meta.page} / {totalPages}
          </span>
          <button
            onClick={() => onPage({ page: meta.page + 1 })}
            disabled={isLastPage}
            style={{
              padding:      '4px 10px',
              border:       '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor:       isLastPage ? 'not-allowed' : 'pointer',
              background:   'var(--color-bg-card)',
              color:        isLastPage ? 'var(--color-border)' : 'var(--color-text)',
            }}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
