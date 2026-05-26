import { useState, type ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number | null
  unit?: string
  icon: ReactNode
  /** Accent color for the top strip and icon tile (default: primary green) */
  accent?: string
  /** Optional percentage delta — positive = up, negative = down */
  delta?: number | null
  /** Optional sparkline bar data (last N values) */
  trend?: number[]
}

export function KpiCard({
  title,
  value,
  unit,
  icon,
  accent = '#1B6B3A',
  delta,
  trend = [],
}: KpiCardProps) {
  const [hover, setHover] = useState(false)

  const displayValue = value === null || value === undefined ? '—' : String(value)
  const showUnit = unit !== undefined && value !== null && value !== undefined

  const deltaUp   = delta != null && delta > 0
  const deltaDown = delta != null && delta < 0
  const maxTrend  = Math.max(...trend, 1)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        boxShadow: hover
          ? '0 4px 14px rgba(44, 36, 22, 0.10)'
          : '0 1px 3px rgba(44, 36, 22, 0.06)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent strip */}
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: accent,
        opacity: 0.85,
      }} />

      {/* Header row: icon + title + delta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: `${accent}1a`,
            color: accent,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
          }}>
            {title}
          </span>
        </div>

        {delta != null && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: deltaUp ? '#d1fae5' : deltaDown ? '#fee2e2' : '#f1ece1',
            color:      deltaUp ? '#065f46' : deltaDown ? '#991b1b' : '#6B5E4E',
            fontVariantNumeric: 'tabular-nums' as const,
            flexShrink: 0,
          }}>
            {deltaUp ? '▲' : deltaDown ? '▼' : '±'} {Math.abs(delta)}%
          </span>
        )}
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
        <span style={{
          fontSize: '30px',
          fontWeight: 700,
          color: 'var(--color-text)',
          fontFamily: 'var(--font-heading)',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          {displayValue}
        </span>
        {showUnit && (
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{unit}</span>
        )}
      </div>

      {/* Sparkline */}
      {trend.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px' }}>
          {trend.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${(v / maxTrend) * 100}%`,
                borderRadius: '2px',
                background: accent,
                opacity: i === trend.length - 1 ? 0.9 : 0.32,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
