import { type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Pencil, Copy, Trash2, Info, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable } from '../../../components/ui'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { FacturesShowProps, ReconciliationState } from '../../../types/achat'

const RECONCILIATION_CONFIG: Record<ReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'À réconcilier', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  reconcile:    { label: 'Réconciliée',   bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  accepted:     { label: 'Acceptée',      bg: 'var(--color-info-bg)',    color: 'var(--color-info)' },
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })

export default function FacturesShow({ facture }: FacturesShowProps) {
  const badge = RECONCILIATION_CONFIG[facture.reconciliation_state]
    ?? { label: facture.reconciliation_state, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }
  const paidBadge = facture.unpaid
    ? { label: 'Non payée', bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)' }
    : { label: 'Payée',     bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' }
  const totalPretax = facture.items.reduce((s, i) => s + i.pretax_amount, 0)
  const totalAmount = facture.items.reduce((s, i) => s + i.amount, 0)
  const visibleItems = facture.items.filter(i => !i._destroy)

  return (
    <div className="max-w-4xl">
      <AchatsTabs />

      <BackLink href="/backend/purchase_invoices" label="Factures" />

      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {facture.number}
        </h1>
        <StateBadge label={badge.label} color={badge.color} bg={badge.bg} dot={false} />
        <StateBadge label={paidBadge.label} color={paidBadge.color} bg={paidBadge.bg} dot={false} />
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>{facture.supplier.full_name}</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {facture.updatable && (
          <PrimaryButton href={`/backend/purchase_invoices/${facture.id}/edit`} variant="secondary">
            <Pencil size={14} /> Modifier
          </PrimaryButton>
        )}
        <PrimaryButton href={`/backend/purchase_invoices/new?duplicate_of=${facture.id}`} variant="secondary">
          <Copy size={14} /> Dupliquer
        </PrimaryButton>
        {facture.destroyable && (
          <button
            type="button"
            onClick={() => { if (window.confirm('Supprimer cette facture ?')) router.delete(`/backend/purchase_invoices/${facture.id}`) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)' }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      <SectionCard className="mb-5">
        <SectionTitle icon={Info}>Informations</SectionTitle>
        <DetailRow items={[
          { label: 'Date facture',   value: facture.invoiced_at },
          { label: 'Référence',      value: facture.reference_number ?? '—' },
          { label: 'Délai paiement', value: facture.payment_delay ?? '—' },
          ...(facture.responsible_name ? [{ label: 'Responsable', value: facture.responsible_name }] : []),
          ...(facture.description ? [{ label: 'Description', value: facture.description, fullWidth: true }] : []),
        ]} />
      </SectionCard>

      <SectionCard className="mb-5">
        <SectionTitle icon={List}>Lignes ({visibleItems.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'designation', label: 'Désignation' },
            { key: 'qty',         label: 'Qté' },
            { key: 'pu',          label: 'PU HT' },
            { key: 'reduction',   label: 'Réd. %' },
            { key: 'ht',          label: 'HT',  align: 'right' },
            { key: 'ttc',         label: 'TTC', align: 'right' },
          ]}
          data={visibleItems}
          footer={
            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <td colSpan={4} className="px-3 py-3 text-sm font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>Total</td>
              <td className="px-3 py-3 text-right font-bold text-sm" style={{ color: 'var(--color-text)' }}>{fmt(totalPretax)}</td>
              <td className="px-3 py-3 text-right font-bold text-sm" style={{ color: 'var(--color-text)' }}>{fmt(totalAmount)}</td>
            </tr>
          }
          renderRow={(item, idx) => (
            <tr key={item.id ?? `new-${idx}`} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>{item.variant_name ?? '—'}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.conditioning_quantity}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{fmt(item.unit_pretax_amount)}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.reduction_percentage}%</td>
              <td className="px-3 py-3 text-right text-sm font-medium" style={{ color: 'var(--color-text)' }}>{fmt(item.pretax_amount)}</td>
              <td className="px-3 py-3 text-right text-sm font-medium" style={{ color: 'var(--color-text)' }}>{fmt(item.amount)}</td>
            </tr>
          )}
        />
      </SectionCard>
    </div>
  )
}

FacturesShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
