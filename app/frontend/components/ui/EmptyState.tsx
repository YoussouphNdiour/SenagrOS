import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  colSpan?: number
}

export function EmptyState({ icon: Icon, message, colSpan }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 py-12" style={{ color: 'var(--color-text-muted)' }}>
      <Icon size={32} style={{ opacity: 0.3 }} />
      <p className="text-sm m-0">{message}</p>
    </div>
  )

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          {content}
        </td>
      </tr>
    )
  }

  return content
}
