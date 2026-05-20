// app/frontend/pages/Backend/Achats/CommandesShow.tsx
import { type ReactNode } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { CommandesShowProps, CommandeState } from '../../../types/achat'

const STATE_CONFIG: Record<CommandeState, { label: string; bg: string; color: string }> = {
  opened: { label: 'En cours',  bg: '#dcfce7', color: '#166534' },
  closed: { label: 'Clôturée',  bg: '#f1f5f9', color: '#475569' },
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
          <a key={tab.href} href={tab.href} style={{ padding: '0.5rem 1.25rem', fontWeight: active ? 600 : 400, borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: '-2px', color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9375rem' }}>
            {tab.label}
          </a>
        )
      })}
    </div>
  )
}

export default function CommandesShow({ commande }: CommandesShowProps) {
  const badge = STATE_CONFIG[commande.state]
  const totalPretax = commande.items.reduce((s, i) => s + i.pretax_amount, 0)
  const totalAmount = commande.items.reduce((s, i) => s + i.amount, 0)
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })

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
        <a href="/backend/purchase_orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Commandes
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{commande.number}</h1>
          <span style={{ background: badge.bg, color: badge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {badge.label}
          </span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{commande.supplier.full_name}</div>
      </div>

      {/* Workflow buttons */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {commande.state === 'opened' && (
          <button type="button" onClick={() => router.post(`/backend/purchase_orders/${commande.id}/close`)} style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}>
            Clôturer
          </button>
        )}
        {commande.state === 'closed' && (
          <button type="button" onClick={() => router.post(`/backend/purchase_orders/${commande.id}/open`)} style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}>
            Rouvrir
          </button>
        )}
        <a href={`/backend/purchase_orders/${commande.id}/edit`} style={{ textDecoration: 'none' }}>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}>
            <Pencil size={14} /> Modifier
          </button>
        </a>
        {commande.destroyable && (
          <button type="button" onClick={() => { if (window.confirm('Supprimer cette commande ?')) router.delete(`/backend/purchase_orders/${commande.id}`) }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}>
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      {/* Attributes */}
      <div style={card}>
        <dl style={dl}>
          <div>
            <dt style={dt}>Date commande</dt>
            <dd style={dd}>{commande.ordered_at}</dd>
          </div>
          {commande.reference_number && (
            <div>
              <dt style={dt}>Référence</dt>
              <dd style={dd}>{commande.reference_number}</dd>
            </div>
          )}
          {commande.responsible_name && (
            <div>
              <dt style={dt}>Responsable</dt>
              <dd style={dd}>{commande.responsible_name}</dd>
            </div>
          )}
          {commande.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <dt style={dt}>Description</dt>
              <dd style={dd}>{commande.description}</dd>
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
                <th key={h} style={{ ...th, textAlign: h === 'HT' || h === 'TTC' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commande.items.filter(i => !i._destroy).map((item, idx) => (
              <tr key={idx}>
                <td style={td}>{item.variant_name ?? '—'}</td>
                <td style={td}>{item.conditioning_quantity}</td>
                <td style={td}>{fmt(item.unit_pretax_amount)}</td>
                <td style={td}>{item.reduction_percentage}%</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(item.pretax_amount)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 600 }}>
              <td colSpan={4} style={{ ...td, textAlign: 'right' }}>Total</td>
              <td style={{ ...td, textAlign: 'right' }}>{fmt(totalPretax)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{fmt(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Receptions link */}
      {commande.receptions_count > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <a href={`/backend/receptions?purchase_order_id=${commande.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9375rem' }}>
            {commande.receptions_count} réception(s) liée(s) →
          </a>
        </div>
      )}
    </div>
  )
}

CommandesShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
