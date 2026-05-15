import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number | null
  unit?: string
  icon: ReactNode
}

export function KpiCard({ title, value, unit, icon }: KpiCardProps) {
  const displayValue = value === null || value === undefined ? '—' : String(value)
  const showUnit = unit !== undefined && value !== null

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
        {icon}
        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
          {displayValue}
        </span>
        {showUnit && (
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{unit}</span>
        )}
      </div>
    </div>
  )
}
