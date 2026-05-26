interface CodeBadgeProps {
  value: string
  variant?: 'default' | 'warning'
}

export function CodeBadge({ value, variant = 'default' }: CodeBadgeProps) {
  const styles =
    variant === 'warning'
      ? { background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }
      : { background: 'var(--color-info-bg)', color: 'var(--color-info-text)' }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono whitespace-nowrap shrink-0"
      style={styles}
    >
      {value}
    </span>
  )
}
