import type { ReactNode } from 'react'
import { ShoppingCart, Package } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, ConfirmDeleteButton, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable } from '../../../components/ui'
import type { BudgetShowProps, PurchaseLine, ReceptionLine } from '../../../types/budget'

export default function BudgetShow({ budget, purchase_lines, total_pretax_amount, reception_lines, canDestroy }: BudgetShowProps) {
  const currency = purchase_lines[0]?.currency ?? 'XOF'

  return (
    <div className="max-w-2xl">
      <BackLink href="/backend/project_budgets" label="Retour aux budgets" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          {budget.name}
        </h1>
        <div className="flex items-center gap-2">
          <PrimaryButton href={`/backend/project_budgets/${budget.id}/edit`} variant="secondary">Modifier</PrimaryButton>
          <ConfirmDeleteButton
            onDelete={() => router.delete(`/backend/project_budgets/${budget.id}`)}
            canDestroy={canDestroy}
            resourceName="ce budget"
          />
        </div>
      </div>

      <SectionCard className="mb-5">
        <DetailRow items={[
          { label: 'Nom',         value: budget.name },
          { label: 'Description', value: budget.description ?? '—' },
          {
            label: 'Code analytique (isacompta)',
            value: budget.isacompta_analytic_code
              ? budget.isacompta_analytic_code
              : <StateBadge label="Manquant" color="var(--color-warning-text)" bg="var(--color-warning-bg)" dot={false} />,
          },
          { label: "Articles d'achat", value: String(budget.purchase_items_count) },
          { label: 'Réceptions',       value: String(budget.reception_items_count) },
        ]} />
      </SectionCard>

      <SectionCard className="mb-5">
        <SectionTitle icon={ShoppingCart}>Lignes d'achat ({purchase_lines.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'designation', label: 'Désignation' },
            { key: 'commande',    label: 'Bon de commande' },
            { key: 'qty',         label: 'Quantité' },
            { key: 'ht',          label: 'Montant HT', align: 'right' },
          ]}
          data={purchase_lines}
          emptyMessage="Aucune ligne d'achat liée à ce budget."
          footer={purchase_lines.length > 0 ? (
            <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-right" style={{ color: 'var(--color-text)' }}>
                Total HT
              </td>
              <td className="px-4 py-2 tabular-nums font-bold text-sm text-right" style={{ color: 'var(--color-text)' }}>
                {total_pretax_amount.toLocaleString('fr-FR')} {currency}
              </td>
            </tr>
          ) : undefined}
          renderRow={(line: PurchaseLine) => (
            <tr key={line.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--color-text)' }}>{line.label}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{line.purchase_number || '—'}</td>
              <td className="px-4 py-2 tabular-nums text-sm" style={{ color: 'var(--color-text)' }}>{line.quantity}</td>
              <td className="px-4 py-2 tabular-nums font-medium text-sm text-right" style={{ color: 'var(--color-text)' }}>
                {line.pretax_amount.toLocaleString('fr-FR')} {line.currency}
              </td>
            </tr>
          )}
        />
      </SectionCard>

      <SectionCard className="mb-5">
        <SectionTitle icon={Package}>Réceptions ({reception_lines.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'produit',   label: 'Produit reçu' },
            { key: 'reception', label: 'Bon de réception' },
            { key: 'qty',       label: 'Quantité' },
          ]}
          data={reception_lines}
          emptyMessage="Aucune réception liée à ce budget."
          renderRow={(line: ReceptionLine) => (
            <tr key={line.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--color-text)' }}>{line.product_name || '—'}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{line.parcel_number || '—'}</td>
              <td className="px-4 py-2 tabular-nums text-sm" style={{ color: 'var(--color-text)' }}>{line.quantity}</td>
            </tr>
          )}
        />
      </SectionCard>
    </div>
  )
}

BudgetShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
