import { AlertCircle } from 'lucide-react'

interface FlashBannerProps {
  errors: Record<string, string | string[]>
}

export function FlashBanner({ errors }: FlashBannerProps) {
  const messages = Object.values(errors).flatMap(v => (Array.isArray(v) ? v : [v]))
  if (messages.length === 0) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg mb-4 p-3 text-sm"
      style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-text)', color: 'var(--color-danger-text)' }}
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <ul className="m-0 p-0 list-none">
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  )
}
