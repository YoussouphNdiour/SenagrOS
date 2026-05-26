// app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx
import { type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Pencil, Trash2, FileText, CheckCircle, Info, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable } from '../../../components/ui'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { ReceptionsShowProps, ReceptionState, ReceptionReconciliationState } from '../../../types/reception'

const STATE_CONFIG: Record<ReceptionState, { label: string; bg: string; color: string }> = {
  draft: { label: 'Brouillon', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  given: { label: 'Validée',   bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
}

const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'Non facturée', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  reconcile:    { label: 'Facturée',     bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
}

const ROLE_LABEL: Record<string, string> = {
  merchandise: 'Marchandise',
  fees: 'Frais',
  service: 'Service',
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ReceptionsShow({ reception }: ReceptionsShowProps) {
  const stateBadge = STATE_CONFIG[reception.state]
    ?? { label: reception.state, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }
  const reconcBadge = RECONCILIATION_CONFIG[reception.reconciliation_state]
    ?? { label: reception.reconciliation_state, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }

  const visibleItems = reception.items.filter(i => !i._destroy)
  const total = visibleItems.reduce((s, i) => s + i.conditioning_quantity * i.unit_pretax_amount, 0)

  return (
    <div className="max-w-4xl">
      <AchatsTabs />

      <BackLink href="/backend/receptions" label="Réceptions" />

      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {reception.number}
        </h1>
        <StateBadge label={stateBadge.label} color={stateBadge.color} bg={stateBadge.bg} dot={false} />
        <StateBadge label={reconcBadge.label} color={reconcBadge.color} bg={reconcBadge.bg} dot={false} />
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>{reception.supplier.full_name}</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {reception.state === 'draft' && (
          <button
            type="button"
            aria-label="Valider"
            onClick={() => router.post(`/backend/receptions/${reception.id}/give`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none' }}
          >
            <CheckCircle size={14} /> Valider
          </button>
        )}
        {reception.state === 'draft' && (
          <PrimaryButton href={`/backend/receptions/${reception.id}/edit`} variant="secondary">
            <Pencil size={14} /> Modifier
          </PrimaryButton>
        )}
        {reception.invoiceable && (
          <PrimaryButton href={`/backend/purchase_invoices/new?reception_id=${reception.id}`} variant="primary">
            <FileText size={14} /> Créer une facture
          </PrimaryButton>
        )}
        {reception.destroyable && (
          <button
            type="button"
            aria-label="Supprimer"
            onClick={() => { if (window.confirm('Supprimer cette réception ?')) router.delete(`/backend/receptions/${reception.id}`) }}
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
          { label: 'Date prévue',    value: reception.planned_at },
          { label: 'Date réception', value: reception.given_at ?? '—' },
          { label: 'Référence',      value: reception.reference_number ?? '—' },
          { label: 'Fournisseur',    value: reception.supplier.full_name },
          ...(reception.purchase_order ? [{
            label: 'Commande',
            value: (
              <a href={`/backend/purchase_orders/${reception.purchase_order.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                {reception.purchase_order.number}
              </a>
            ),
          }] : []),
        ]} />
      </SectionCard>

      <SectionCard className="mb-5">
        <SectionTitle icon={List}>Lignes ({visibleItems.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'designation', label: 'Désignation' },
            { key: 'qty',         label: 'Qté' },
            { key: 'pu',          label: 'Prix unitaire HT' },
            { key: 'role',        label: 'Rôle' },
            { key: 'non_comp',    label: 'Non conforme' },
            { key: 'ht',          label: 'HT ligne', align: 'right' },
          ]}
          data={visibleItems}
          footer={
            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <td colSpan={5} className="px-3 py-3 text-sm font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>Total HT</td>
              <td className="px-3 py-3 text-right font-bold text-sm" style={{ color: 'var(--color-text)' }}>{fmt(total)}</td>
            </tr>
          }
          renderRow={(item, idx) => (
            <tr key={item.id ?? `new-${idx}`} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>{item.variant_name ?? '—'}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.conditioning_quantity}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{fmt(item.unit_pretax_amount)}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{ROLE_LABEL[item.role] ?? item.role}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.non_compliant ? '✓' : '—'}</td>
              <td className="px-3 py-3 text-right text-sm font-medium" style={{ color: 'var(--color-text)' }}>{fmt(item.conditioning_quantity * item.unit_pretax_amount)}</td>
            </tr>
          )}
        />
      </SectionCard>
    </div>
  )
}

ReceptionsShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
