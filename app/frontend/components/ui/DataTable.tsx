import type { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: Column[]
  data: T[]
  renderRow: (item: T, index: number) => ReactNode
  footer?: ReactNode
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  renderRow,
  footer,
  emptyMessage = 'Aucun élément',
}: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ background: 'var(--color-bg)' }}>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b text-${col.align ?? 'left'}`}
              style={{
                color: 'var(--color-text-muted)',
                borderColor: 'var(--color-border)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="p-8 text-center text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((item, index) => renderRow(item, index))
        )}
      </tbody>
      {footer && <tfoot>{footer}</tfoot>}
    </table>
  )
}
