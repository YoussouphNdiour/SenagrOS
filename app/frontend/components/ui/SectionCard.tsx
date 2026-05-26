import type { ReactNode } from 'react'

interface SectionCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function SectionCard({ children, className = '', noPadding }: SectionCardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  )
}
