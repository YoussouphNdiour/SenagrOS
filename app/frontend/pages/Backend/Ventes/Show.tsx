import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Edit, Copy, FileText, CheckCircle, XCircle, Receipt, Info, List, CreditCard, Truck } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable, ConfirmDeleteButton } from '../../../components/ui'
import type { VentesShowProps, VenteState } from '../../../types/vente'

const STATE_CONFIG: Record<VenteState, { label: string; bg: string; color: string }> = {
  draft:    { label: 'Brouillon', bg: 'var(--color-bg-subtle)',  color: 'var(--color-text-muted)' },
  estimate: { label: 'Devis',     bg: 'var(--color-info-bg)',    color: 'var(--color-info)' },
  aborted:  { label: 'Annulé',    bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)' },
  refused:  { label: 'Refusé',    bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  order:    { label: 'Commande',  bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  invoice:  { label: 'Facture',   bg: '#ede9fe',                 color: '#5b21b6' },
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
    danger:    { background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)' },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium cursor-pointer"
      style={styles[variant]}
    >
      {icon}
      {label}
    </button>
  )
}

function VentesShow({ sale }: VentesShowProps) {
  const state = STATE_CONFIG[sale.state] ?? { label: sale.state_label, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }

  function workflowPost(action: string) {
    router.post(`/backend/sales/${sale.id}/${action}`)
  }

  const totalHT = sale.items.reduce((sum, item) => sum + item.pretax_amount, 0)
  const totalTTC = sale.items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <>
      <BackLink href="/backend/sales" label="Retour aux ventes" />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold mb-2 m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {sale.number}
          </h1>
          <StateBadge label={state.label} color={state.color} bg={state.bg} />
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
            <PrimaryButton href={`/backend/sales/${sale.id}/edit`} variant="secondary">
              <Edit size={15} /> Modifier
            </PrimaryButton>
          )}
          <ConfirmDeleteButton
            onDelete={() => router.delete(`/backend/sales/${sale.id}`)}
            canDestroy={sale.canDestroy}
            resourceName="cette vente"
          />
        </div>
      </div>

      <SectionCard className="mb-5">
        <SectionTitle icon={Info}>Informations</SectionTitle>
        <DetailRow items={[
          { label: 'Client',           value: sale.client.full_name },
          { label: 'Nature',           value: sale.nature_name ?? '—' },
          { label: 'Référence',        value: sale.reference_number ?? '—' },
          { label: 'Responsable',      value: sale.responsible_name ?? '—' },
          { label: 'Délai paiement',   value: sale.payment_delay ?? '—' },
          { label: 'Date création',    value: sale.created_at.slice(0, 10) },
          { label: 'Date facture',     value: sale.invoiced_at ? sale.invoiced_at.slice(0, 10) : '—' },
          { label: 'Date confirmation', value: sale.confirmed_at ? sale.confirmed_at.slice(0, 10) : '—' },
          ...(sale.description ? [{ label: 'Description', value: sale.description, fullWidth: true }] : []),
        ]} />
      </SectionCard>

      <SectionCard className="mb-5">
        <SectionTitle icon={List}>Lignes ({sale.items.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'produit', label: 'Produit' },
            { key: 'qty', label: 'Qté' },
            { key: 'unit', label: 'Unité' },
            { key: 'pu', label: 'PU HT' },
            { key: 'tva', label: 'TVA' },
            { key: 'remise', label: 'Remise %' },
            { key: 'ht', label: 'HT', align: 'right' },
            { key: 'ttc', label: 'TTC', align: 'right' },
          ]}
          data={sale.items}
          footer={
            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <td colSpan={6} className="px-3 py-3 text-sm font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>
                Total
              </td>
              <td className="px-3 py-3 text-right font-bold text-sm" style={{ color: 'var(--color-text)' }}>{formatAmount(totalHT, sale.currency)}</td>
              <td className="px-3 py-3 text-right font-bold text-sm" style={{ color: 'var(--color-text)' }}>{formatAmount(totalTTC, sale.currency)}</td>
            </tr>
          }
          renderRow={(item, i) => (
            <tr key={item.id ?? i} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3 font-medium text-sm" style={{ color: 'var(--color-text)' }}>{item.variant_name ?? '—'}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.conditioning_quantity}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.conditioning_unit_name ?? '—'}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{formatAmount(item.unit_pretax_amount, sale.currency)}</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{(item.tax_rate * 100).toFixed(0)}%</td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.reduction_percentage}%</td>
              <td className="px-3 py-3 text-right font-medium text-sm" style={{ color: 'var(--color-text)' }}>{formatAmount(item.pretax_amount, sale.currency)}</td>
              <td className="px-3 py-3 text-right font-medium text-sm" style={{ color: 'var(--color-text)' }}>{formatAmount(item.amount, sale.currency)}</td>
            </tr>
          )}
        />
      </SectionCard>

      {sale.affair && (
        <SectionCard className="mb-5">
          <div className="flex items-center gap-2 mb-4">
            <SectionTitle icon={CreditCard}>
              Paiements — solde : {formatAmount(sale.affair.balance, sale.currency)}
            </SectionTitle>
            {sale.affair.closed && (
              <StateBadge label="Soldé" color="var(--color-success-text)" bg="var(--color-success-bg)" dot={false} />
            )}
          </div>
          {sale.affair.incoming_payments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucun paiement reçu.</p>
          ) : (
            <DataTable
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'mode', label: 'Mode' },
                { key: 'montant', label: 'Montant', align: 'right' },
              ]}
              data={sale.affair.incoming_payments}
              renderRow={(p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.paid_at ? p.paid_at.slice(0, 10) : '—'}</td>
                  <td className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.mode_name ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-medium text-sm" style={{ color: 'var(--color-text)' }}>{formatAmount(p.amount, sale.currency)}</td>
                </tr>
              )}
            />
          )}
        </SectionCard>
      )}

      {sale.shipments.length > 0 && (
        <SectionCard className="mb-5">
          <SectionTitle icon={Truck}>Livraisons ({sale.shipments.length})</SectionTitle>
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
        </SectionCard>
      )}

      {sale.credits.length > 0 && (
        <SectionCard>
          <SectionTitle icon={Receipt}>Avoirs ({sale.credits.length})</SectionTitle>
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
        </SectionCard>
      )}
    </>
  )
}

VentesShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default VentesShow
