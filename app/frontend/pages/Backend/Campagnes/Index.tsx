import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { AppShell } from '../../../components/AppShell'
import type { CampagnesIndexProps } from '../../../types/campagne'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import type { Campagne } from '../../../types/campagne'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

const columnHelper = createColumnHelper<Campagne>()

function CampagnesIndex({ campagnes, meta }: CampagnesIndexProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'harvest_year', desc: true }])

  const columns = useMemo(
    () => [
      columnHelper.accessor('harvest_year', {
        header: 'Année',
        cell: (info) => (
          <span className="font-bold" style={{ color: 'var(--color-text)' }}>
            {info.getValue()}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('name', {
        header: 'Nom',
        cell: (info) => (
          <span style={{ color: 'var(--color-text)' }}>{info.getValue()}</span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('closed', {
        header: 'État',
        cell: (info) => {
          const closed = info.getValue()
          return closed ? (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: '#e5e7eb', color: '#6b7280' }}
            >
              Clôturée
            </span>
          ) : (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: '#dcfce7', color: '#16a34a' }}
            >
              En cours
            </span>
          )
        },
        enableSorting: false,
      }),
    ],
    []
  )

  const table = useReactTable({
    data: campagnes,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      <div className="mb-5">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          Campagnes
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total} campagne{meta.total !== 1 ? 's' : ''}
        </p>
      </div>

      {campagnes.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucune campagne enregistrée.
        </p>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b-2"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left uppercase tracking-wide text-xs font-semibold"
                      style={{ color: 'var(--color-text-muted)', cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && ' ↑'}
                      {header.column.getIsSorted() === 'desc' && ' ↓'}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

CampagnesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default CampagnesIndex
