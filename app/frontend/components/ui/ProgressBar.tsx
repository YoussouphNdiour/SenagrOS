interface ProgressBarProps {
  value: number
  max: number
  fillColor?: string
  height?: number
  label?: string
}

export function ProgressBar({
  value,
  max,
  fillColor = 'var(--color-primary)',
  height = 4,
  label,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <>
      <div
        className="rounded-full overflow-hidden relative"
        style={{ background: 'var(--color-border)', height: `${height}px` }}
      >
        <div
          className="h-full rounded-full absolute left-0 top-0"
          style={{ width: `${pct}%`, background: fillColor, transition: 'width 0.3s' }}
        />
      </div>
      {label && (
        <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
      )}
    </>
  )
}
