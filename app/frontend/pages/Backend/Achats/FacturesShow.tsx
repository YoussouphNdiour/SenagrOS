import { type ReactNode } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Pencil, Copy, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { FacturesShowProps, ReconciliationState } from '../../../types/achat'

const RECONCILIATION_CONFIG: Record<ReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'À réconcilier', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Réconciliée',   bg: '#dcfce7', color: '#166534' },
  accepted:     { label: 'Acceptée',      bg: '#dbeafe', color: '#1e40af' },
}

function AchatsTabs() {
  const { url } = usePage()
  const tabs = [
    { href: '/backend/purchase_orders',   label: 'Commandes' },
    { href: '/backend/purchase_invoices', label: 'Factures' },
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

export default function FacturesShow({ facture }: FacturesShowProps) {
  const badge = RECONCILIATION_CONFIG[facture.reconciliation_state]
    ?? { label: facture.reconciliation_state, bg: '#f3f4f6', color: '#6b7280' }
  const paidBadge = facture.unpaid
    ? { label: 'Non payée', bg: '#fee2e2', color: '#991b1b' }
    : { label: 'Payée',     bg: '#dcfce7', color: '#166534' }
  const totalPretax = facture.items.reduce((s, i) => s + i.pretax_amount, 0)
  const totalAmount = facture.items.reduce((s, i) => s + i.amount, 0)
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })

  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1.5rem',
    marginBottom: '1.25rem',
  }
  const dl: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    margin: 0,
  }
  const dtStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted)',
    marginBottom: '0.25rem',
  }
  const ddStyle: React.CSSProperties = {
    fontSize: '0.9375rem',
    fontWeight: 500,
    margin: 0,
  }
  const thStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    textAlign: 'left',
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted)',
    fontWeight: 600,
    borderBottom: '1px solid var(--color-border)',
  }
  const tdStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    borderBottom: '1px solid var(--color-border)',
  }
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    background: 'var(--color-bg-card)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontWeight: 500,
    textDecoration: 'none',
    fontSize: '0.9375rem',
  }

  return (
    <div style={{ padding: '2rem' }}>
      <AchatsTabs />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <a
          href="/backend/purchase_invoices"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={14} /> Factures
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {facture.number}
          </h1>
          <span style={{ background: badge.bg, color: badge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {badge.label}
          </span>
          <span style={{ background: paidBadge.bg, color: paidBadge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {paidBadge.label}
          </span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {facture.supplier.full_name}
        </div>
      </div>

      {/* Action buttons — <a> for navigation links, <button> only for destructive actions */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {facture.updatable && (
          <a href={`/backend/purchase_invoices/${facture.id}/edit`} style={btnStyle}>
            <Pencil size={14} /> Modifier
          </a>
        )}
        <a href={`/backend/purchase_invoices/new?duplicate_of=${facture.id}`} style={btnStyle}>
          <Copy size={14} /> Dupliquer
        </a>
        {facture.destroyable && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Supprimer cette facture ?')) {
                router.delete(`/backend/purchase_invoices/${facture.id}`)
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      {/* Attributes */}
      <div style={card}>
        <dl style={dl}>
          <div>
            <dt style={dtStyle}>Date facture</dt>
            <dd style={ddStyle}>{facture.invoiced_at}</dd>
          </div>
          {facture.reference_number && (
            <div>
              <dt style={dtStyle}>Référence</dt>
              <dd style={ddStyle}>{facture.reference_number}</dd>
            </div>
          )}
          {facture.payment_delay && (
            <div>
              <dt style={dtStyle}>Délai paiement</dt>
              <dd style={ddStyle}>{facture.payment_delay}</dd>
            </div>
          )}
          {facture.responsible_name && (
            <div>
              <dt style={dtStyle}>Responsable</dt>
              <dd style={ddStyle}>{facture.responsible_name}</dd>
            </div>
          )}
          {facture.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <dt style={dtStyle}>Description</dt>
              <dd style={ddStyle}>{facture.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Items table */}
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Désignation', 'Qté', 'PU HT', 'Réd. %', 'HT', 'TTC'].map(h => (
                <th
                  key={h}
                  style={{ ...thStyle, textAlign: h === 'HT' || h === 'TTC' ? 'right' : 'left' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facture.items.filter(i => !i._destroy).map((item, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{item.variant_name ?? '—'}</td>
                <td style={tdStyle}>{item.conditioning_quantity}</td>
                <td style={tdStyle}>{item.unit_pretax_amount}</td>
                <td style={tdStyle}>{item.reduction_percentage}%</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.pretax_amount}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 600 }}>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'right' }}>Total</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(totalPretax)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

FacturesShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
