import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import {
  ArrowLeft, Edit, Trash2, Copy, FileText, CheckCircle, XCircle, Receipt,
} from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { VentesShowProps, VenteState } from '../../../types/vente'

const STATE_CONFIG: Record<VenteState, { label: string; bg: string; color: string }> = {
  draft:    { label: 'Brouillon', bg: '#f3f4f6', color: '#374151' },
  estimate: { label: 'Devis',     bg: '#dbeafe', color: '#1d4ed8' },
  aborted:  { label: 'Annulé',    bg: '#fee2e2', color: '#991b1b' },
  refused:  { label: 'Refusé',    bg: '#fef3c7', color: '#92400e' },
  order:    { label: 'Commande',  bg: '#d1fae5', color: '#065f46' },
  invoice:  { label: 'Facture',   bg: '#ede9fe', color: '#5b21b6' },
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function WorkflowButton({
  label,
  icon,
  onClick,
  variant = 'secondary',
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--color-primary)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
    danger:    { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium"
      style={{ cursor: 'pointer', ...styles[variant] }}
    >
      {icon}
      {label}
    </button>
  )
}

function VentesShow({ sale }: VentesShowProps) {
  const state = STATE_CONFIG[sale.state] ?? { label: sale.state_label, bg: '#f3f4f6', color: '#374151' }

  function workflowPost(action: string) {
    router.post(`/backend/sales/${sale.id}/${action}`)
  }

  function handleDestroy() {
    if (!window.confirm('Supprimer définitivement cette vente ?')) return
    router.delete(`/backend/sales/${sale.id}`)
  }

  const totalHT = sale.items.reduce((sum, item) => sum + item.pretax_amount, 0)
  const totalTTC = sale.items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <>
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/backend/sales" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} />
          Retour aux ventes
        </a>
      </div>

      {/* Title + state + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {sale.number}
          </h1>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: state.bg, color: state.color }}
          >
            {state.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(sale.state === 'draft' || sale.state === 'estimate') && (
            <WorkflowButton label="Proposer" icon={<FileText size={15} />} onClick={() => workflowPost('propose')} variant="primary" />
          )}
          {sale.state === 'estimate' && (
            <WorkflowButton label="Confirmer" icon={<CheckCircle size={15} />} onClick={() => workflowPost('confirm')} variant="primary" />
          )}
          {sale.state === 'order' && (
            <WorkflowButton label="Facturer" icon={<Receipt size={15} />} onClick={() => workflowPost('invoice')} variant="primary" />
          )}
          {(sale.state === 'estimate' || sale.state === 'order') && (
            <WorkflowButton label="Annuler" icon={<XCircle size={15} />} onClick={() => workflowPost('abort')} variant="danger" />
          )}
          <WorkflowButton label="Dupliquer" icon={<Copy size={15} />} onClick={() => workflowPost('duplicate')} />
          {sale.updateable && (
            <a
              href={`/backend/sales/${sale.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium no-underline"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
              <Edit size={15} />
              Modifier
            </a>
          )}
          {sale.destroyable && (
            <WorkflowButton label="Supprimer" icon={<Trash2 size={15} />} onClick={handleDestroy} variant="danger" />
          )}
        </div>
      </div>

      {/* Attributes card */}
      <div
        className="rounded-lg p-5 mb-5"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Informations
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: 'Client', value: sale.client.full_name },
            { label: 'Nature', value: sale.nature_name ?? '—' },
            { label: 'Référence', value: sale.reference_number ?? '—' },
            { label: 'Responsable', value: sale.responsible_name ?? '—' },
            { label: 'Délai paiement', value: sale.payment_delay ?? '—' },
            { label: 'Date création', value: sale.created_at.slice(0, 10) },
            { label: 'Date facture', value: sale.invoiced_at ? sale.invoiced_at.slice(0, 10) : '—' },
            { label: 'Date confirmation', value: sale.confirmed_at ? sale.confirmed_at.slice(0, 10) : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
            </div>
          ))}
        </dl>
        {sale.description && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
            <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{sale.description}</dd>
          </div>
        )}
      </div>

      {/* Items table */}
      <div
        className="rounded-lg overflow-hidden mb-5"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Lignes ({sale.items.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              {['Produit', 'Qté', 'Unité', 'PU HT', 'TVA', 'Remise %', 'HT', 'TTC'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={item.id ?? i} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{item.variant_name ?? '—'}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{item.conditioning_quantity}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{item.conditioning_unit_name ?? '—'}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{formatAmount(item.unit_pretax_amount, sale.currency)}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{(item.tax_rate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{item.reduction_percentage}%</td>
                <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--color-text)' }}>{formatAmount(item.pretax_amount, sale.currency)}</td>
                <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--color-text)' }}>{formatAmount(item.amount, sale.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>
                Total
              </td>
              <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text)' }}>{formatAmount(totalHT, sale.currency)}</td>
              <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text)' }}>{formatAmount(totalTTC, sale.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Affair / paiements */}
      {sale.affair && (
        <div
          className="rounded-lg p-5 mb-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Paiements — solde : {formatAmount(sale.affair.balance, sale.currency)}
            {sale.affair.closed && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs" style={{ background: '#d1fae5', color: '#065f46' }}>Soldé</span>
            )}
          </h2>
          {sale.affair.incoming_payments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucun paiement reçu.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Mode', 'Montant'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sale.affair.incoming_payments.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>{p.paid_at ? p.paid_at.slice(0, 10) : '—'}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>{p.mode_name ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--color-text)' }}>{formatAmount(p.amount, sale.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Shipments */}
      {sale.shipments.length > 0 && (
        <div
          className="rounded-lg p-5 mb-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Livraisons ({sale.shipments.length})</h2>
          <ul className="flex flex-col gap-2">
            {sale.shipments.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <a href={`/backend/parcels/${s.id}`} className="font-medium no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>
                  {s.number}
                </a>
                <span style={{ color: 'var(--color-text-muted)' }}>{s.human_state_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Credits */}
      {sale.credits.length > 0 && (
        <div
          className="rounded-lg p-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Avoirs ({sale.credits.length})</h2>
          <ul className="flex flex-col gap-2">
            {sale.credits.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <a href={`/backend/sales/${c.id}`} className="font-medium no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>
                  {c.number}
                </a>
                <span style={{ color: 'var(--color-text)' }}>{formatAmount(c.amount, c.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

VentesShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default VentesShow
