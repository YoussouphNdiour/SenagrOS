import type { ReactNode } from 'react'

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string | number
  color: string
}

export function KpiCard({ icon, label, value, color }: KpiCardProps) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-[var(--radius-card)]"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span
        className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
        style={{ background: `${color}1a`, color }}
      >
        {icon}
      </span>
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </div>
        <div
          className="text-[22px] font-bold leading-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
