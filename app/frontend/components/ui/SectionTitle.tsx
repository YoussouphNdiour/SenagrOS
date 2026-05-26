import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionTitleProps {
  icon?: LucideIcon
  children: ReactNode
}

export function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <h2
      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest mb-4 m-0"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </h2>
  )
}
