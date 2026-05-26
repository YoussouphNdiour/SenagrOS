import { ArrowLeft } from 'lucide-react'

interface BackLinkProps {
  href: string
  label: string
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-sm no-underline mb-6"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <ArrowLeft size={16} />
      {label}
    </a>
  )
}
