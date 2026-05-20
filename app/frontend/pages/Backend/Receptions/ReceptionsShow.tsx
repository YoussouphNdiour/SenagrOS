// app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx
import { type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Pencil, Trash2, FileText, CheckCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { ReceptionsShowProps, ReceptionState, ReceptionReconciliationState } from '../../../types/reception'

const STATE_CONFIG: Record<ReceptionState, { label: string; bg: string; color: string }> = {
  draft: { label: 'Brouillon', bg: '#fef9c3', color: '#854d0e' },
  given: { label: 'Validée',   bg: '#dcfce7', color: '#166534' },
}

const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'Non facturée', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Facturée',     bg: '#dcfce7', color: '#166534' },
}

const ROLE_LABEL: Record<string, string> = {
  merchandise: 'Marchandise',
  fees: 'Frais',
  service: 'Service',
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReceptionsShow({ reception }: ReceptionsShowProps) {
  const stateBadge = STATE_CONFIG[reception.state] ?? { label: reception.state, bg: '#f3f4f6', color: '#6b7280' }
  const reconcBadge = RECONCILIATION_CONFIG[reception.reconciliation_state] ?? { label: reception.reconciliation_state, bg: '#f3f4f6', color: '#6b7280' }

  const visibleItems = reception.items.filter(i => !i._destroy)
  const total = visibleItems.reduce((s, i) => s + i.conditioning_quantity * i.unit_pretax_amount, 0)

  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '1.25rem' }
  const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', margin: 0 }
  const dt: React.CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }
  const dd: React.CSSProperties = { fontSize: '0.9375rem', fontWeight: 500, margin: 0 }
  const th: React.CSSProperties = { padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }
  const td: React.CSSProperties = { padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--color-border)' }

  return (
    <div style={{ padding: '2rem' }}>
      <AchatsTabs />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="/backend/receptions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Réceptions
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{reception.number}</h1>
          <span style={{ background: stateBadge.bg, color: stateBadge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {stateBadge.label}
          </span>
          <span style={{ background: reconcBadge.bg, color: reconcBadge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {reconcBadge.label}
          </span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{reception.supplier.full_name}</div>
      </div>

      {/* Workflow buttons */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {reception.state === 'draft' && (
          <button
            type="button"
            aria-label="Valider"
            onClick={() => router.post(`/backend/receptions/${reception.id}/give`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <CheckCircle size={14} /> Valider
          </button>
        )}
        {reception.state === 'draft' && (
          <a href={`/backend/receptions/${reception.id}/edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 500, textDecoration: 'none', fontSize: '0.9375rem' }}>
            <Pencil size={14} /> Modifier
          </a>
        )}
        {reception.invoiceable && (
          <a
            href={`/backend/purchase_invoices/new?reception_id=${reception.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: '#166534', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 500, textDecoration: 'none', fontSize: '0.9375rem' }}
          >
            <FileText size={14} /> Créer une facture
          </a>
        )}
        {reception.destroyable && (
          <button
            type="button"
            aria-label="Supprimer"
            onClick={() => { if (window.confirm('Supprimer cette réception ?')) router.delete(`/backend/receptions/${reception.id}`) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      {/* Attributes card */}
      <div style={card}>
        <dl style={dl}>
          <div>
            <dt style={dt}>Date prévue</dt>
            <dd style={dd}>{reception.planned_at}</dd>
          </div>
          <div>
            <dt style={dt}>Date réception</dt>
            <dd style={dd}>{reception.given_at ?? '—'}</dd>
          </div>
          <div>
            <dt style={dt}>Référence</dt>
            <dd style={dd}>{reception.reference_number ?? '—'}</dd>
          </div>
          {reception.purchase_order && (
            <div>
              <dt style={dt}>Commande</dt>
              <dd style={dd}>
                <a href={`/backend/purchase_orders/${reception.purchase_order.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  {reception.purchase_order.number}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt style={dt}>Fournisseur</dt>
            <dd style={dd}>{reception.supplier.full_name}</dd>
          </div>
        </dl>
      </div>

      {/* Items table (read-only) */}
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Désignation', 'Qté', 'Prix unitaire HT', 'Rôle', 'Non conforme', 'HT ligne'].map(h => (
                <th key={h} style={{ ...th, textAlign: h === 'HT ligne' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, idx) => (
              <tr key={item.id ?? `new-${idx}`}>
                <td style={td}>{item.variant_name ?? '—'}</td>
                <td style={td}>{item.conditioning_quantity}</td>
                <td style={td}>{fmt(item.unit_pretax_amount)}</td>
                <td style={td}>{ROLE_LABEL[item.role] ?? item.role}</td>
                <td style={td}>{item.non_compliant ? '✓' : '—'}</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(item.conditioning_quantity * item.unit_pretax_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 600 }}>
              <td colSpan={5} style={{ ...td, textAlign: 'right' }}>Total HT</td>
              <td style={{ ...td, textAlign: 'right' }}>{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

ReceptionsShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
