// app/frontend/pages/Backend/Achats/CommandesShow.tsx
import { type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Pencil, Info, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable, ConfirmDeleteButton } from '../../../components/ui'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { CommandesShowProps, CommandeState } from '../../../types/achat'

const STATE_CONFIG: Record<CommandeState, { label: string; bg: string; color: string }> = {
  opened: { label: 'En cours', bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  closed: { label: 'Clôturée', bg: 'var(--color-bg-subtle)',  color: 'var(--color-text-muted)' },
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })

export default function CommandesShow({ commande }: CommandesShowProps) {
  const badge = STATE_CONFIG[commande.state]
  const totalPretax = commande.items.reduce((s, i) => s + i.pretax_amount, 0)
  const totalAmount = commande.items.reduce((s, i) => s + i.amount, 0)
  const visibleItems = commande.items.filter(i => !i._destroy)

  return (
    <div className="max-w-4xl">
      <AchatsTabs />

      <BackLink href="/backend/purchase_orders" label="Commandes" />

      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {commande.number}
        </h1>
        <StateBadge label={badge.label} color={badge.color} bg={badge.bg} dot={false} />
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>{commande.supplier.full_name}</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {commande.state === 'opened' && (
          <button
            type="button"
            onClick={() => router.post(`/backend/purchase_orders/${commande.id}/close`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)' }}
          >
            Clôturer
          </button>
        )}
        {commande.state === 'closed' && (
          <button
            type="button"
            onClick={() => router.post(`/backend/purchase_orders/${commande.id}/open`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            Rouvrir
          </button>
        )}
        <PrimaryButton href={`/backend/purchase_orders/${commande.id}/edit`} variant="secondary">
          <Pencil size={14} /> Modifier
        </PrimaryButton>
        <ConfirmDeleteButton
          onDelete={() => router.delete(`/backend/purchase_orders/${commande.id}`)}
          canDestroy={commande.canDestroy}
          resourceName="cette commande"
        />
      </div>

      <SectionCard className="mb-5">
        <SectionTitle icon={Info}>Informations</SectionTitle>
        <DetailRow items={[
          { label: 'Date commande', value: commande.ordered_at },
          { label: 'Référence',     value: commande.reference_number || '—' },
          { label: 'Responsable',   value: commande.responsible_name || '—' },
          ...(commande.description ? [{ label: 'Description', value: commande.description, fullWidth: true }] : []),
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
            <tr key={idx} style={{ borderTop: '1px solid var(--color-border)' }}>
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

      {commande.receptions_count > 0 && (
        <p className="text-sm mt-2">
          <a href={`/backend/receptions?purchase_order_id=${commande.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            {commande.receptions_count} réception(s) liée(s) →
          </a>
        </p>
      )}
    </div>
  )
}

CommandesShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
