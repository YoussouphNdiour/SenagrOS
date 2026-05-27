import { AlertCircle } from 'lucide-react'

interface FlashBannerProps {
  /** Validation errors from Inertia — keys are field names, values are message(s) */
  errors: Record<string, string | string[]>
}

export function FlashBanner({ errors }: FlashBannerProps) {
  const messages = Object.values(errors).flatMap(v => (Array.isArray(v) ? v : [v]))
  if (messages.length === 0) return null

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        borderRadius: '8px',
        background: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger-text)',
        color: 'var(--color-danger-text)',
        fontSize: '14px',
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  )
}
