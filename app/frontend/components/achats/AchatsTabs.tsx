// app/frontend/components/achats/AchatsTabs.tsx
import { usePage } from '@inertiajs/react'

export default function AchatsTabs() {
  const { url } = usePage()
  const tabs = [
    { href: '/backend/purchase_orders',   label: 'Commandes' },
    { href: '/backend/purchase_invoices', label: 'Factures' },
    { href: '/backend/receptions',        label: 'Réceptions' },
  ]
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)' }}>
      {tabs.map(tab => {
        const active = url.startsWith(tab.href)
        return (
          <a
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.5rem 1.25rem',
              fontWeight: active ? 600 : 400,
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.9375rem',
            }}
          >
            {tab.label}
          </a>
        )
      })}
    </div>
  )
}
