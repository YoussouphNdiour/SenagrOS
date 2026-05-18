import type { Production } from '../../types/production'

interface GanttViewProps {
  productions: Production[]
}

function parseDate(iso: string): number {
  return new Date(iso).getTime()
}

export function GanttView({ productions }: GanttViewProps) {
  if (productions.length === 0) return null

  const minDate = Math.min(...productions.map((p) => parseDate(p.started_on)))
  const maxDate = Math.max(
    ...productions.map((p) =>
      p.stopped_on ? parseDate(p.stopped_on) : parseDate(p.started_on)
    )
  )
  const span = maxDate - minDate || 1
  const oneDay = 24 * 60 * 60 * 1000

  return (
    <div
      data-testid="gantt-view"
      style={{
        padding: '16px',
        background: 'var(--color-bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    >
      {productions.map((p) => {
        const start = parseDate(p.started_on)
        const barEnd = p.stopped_on ? parseDate(p.stopped_on) : start + oneDay
        const leftPct = (((start - minDate) / span) * 100).toFixed(2) + '%'
        const widthPct = (((barEnd - start) / span) * 100).toFixed(2) + '%'

        return (
          <div
            key={p.id}
            data-testid="gantt-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: '160px',
                flexShrink: 0,
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--color-text)',
              }}
            >
              {p.name}
            </div>
            <div
              style={{
                flex: 1,
                height: '32px',
                position: 'relative',
              }}
            >
              <div
                data-testid="gantt-bar"
                title={p.name}
                style={{
                  position: 'absolute',
                  left: leftPct,
                  width: widthPct,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--color-primary, #6B9E3F)',
                  height: '20px',
                  borderRadius: '3px',
                  minWidth: '4px',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
