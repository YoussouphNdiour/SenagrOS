interface StateBadgeProps {
  label: string
  color: string
  bg: string
  border?: string
  dot?: boolean
}

export function StateBadge({ label, color, bg, border, dot = true }: StateBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: bg, color, border: border ? `1px solid ${border}` : undefined }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      )}
      {label}
    </span>
  )
}
