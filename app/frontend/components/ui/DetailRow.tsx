import type { ReactNode } from 'react'

interface DetailItem {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

interface DetailRowProps {
  items: DetailItem[]
  cols?: 2 | 3
}

export function DetailRow({ items, cols = 2 }: DetailRowProps) {
  return (
    <dl className={`grid gap-x-6 gap-y-3 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {items.map(({ label, value, fullWidth }) => (
        <div key={label} className={fullWidth ? 'col-span-full' : ''}>
          <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </dt>
          <dd className="text-sm font-medium m-0" style={{ color: 'var(--color-text)' }}>
            {value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
