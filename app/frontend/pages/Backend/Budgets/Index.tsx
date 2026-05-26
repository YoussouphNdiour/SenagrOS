import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Wallet, ShoppingBag, Package, Trash2, Edit } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, EmptyState, ProgressBar, CodeBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { BudgetsIndexProps } from '../../../types/budget'

function BudgetsIndex({ budgets, meta }: BudgetsIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const totalPurchases = budgets.reduce((s, b) => s + b.purchase_items_count, 0)
  const totalReceptions = budgets.reduce((s, b) => s + b.reception_items_count, 0)

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Supprimer le budget "${name}" ?`)) return
    router.delete(`/backend/project_budgets/${id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Budgets projet"
        subtitle={`${meta.total} budget${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/project_budgets/new">
            <Plus size={14} /> Nouveau budget
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard icon={<Wallet size={16} />}      label="Total budgets"     value={meta.total}       color="var(--color-primary)" />
        <KpiCard icon={<ShoppingBag size={16} />} label="Lignes achats"     value={totalPurchases}   color="var(--color-warning)" />
        <KpiCard icon={<Package size={16} />}     label="Lignes réceptions" value={totalReceptions}  color="var(--color-info)" />
      </div>

      {budgets.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Wallet} message="Aucun budget projet enregistré" />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <ul className="list-none m-0 p-0">
            {budgets.map((budget, idx) => (
              <li
                key={budget.id}
                className="flex items-center gap-4 px-4 py-4 border-b"
                style={{ borderColor: idx < budgets.length - 1 ? 'var(--color-border)' : 'transparent' }}
              >
                <span
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-bg-highlight)', color: 'var(--color-primary)' }}
                >
                  <Wallet size={18} />
                </span>

                <div className="flex-1 min-w-0">
                  <a href={`/backend/project_budgets/${budget.id}`} className="text-sm font-bold no-underline" style={{ color: 'var(--color-primary)' }}>
                    {budget.name}
                  </a>
                  {budget.description && (
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {budget.description}
                    </div>
                  )}
                  {budget.purchase_items_count > 0 && (
                    <ProgressBar
                      value={budget.reception_items_count}
                      max={budget.purchase_items_count}
                      label={`${budget.reception_items_count}/${budget.purchase_items_count} reçus`}
                    />
                  )}
                </div>

                {budget.isacompta_analytic_code ? (
                  <CodeBadge value={budget.isacompta_analytic_code} />
                ) : (
                  <CodeBadge value="Code manquant" variant="warning" />
                )}

                <div className="flex gap-3 shrink-0 text-center">
                  {[
                    { n: budget.purchase_items_count,  l: 'Achats' },
                    { n: budget.reception_items_count, l: 'Réceptions' },
                  ].map(({ n, l }) => (
                    <div key={l}>
                      <div className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{n}</div>
                      <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{l}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 items-center shrink-0">
                  <a href={`/backend/project_budgets/${budget.id}/edit`} title="Modifier" style={{ color: 'var(--color-text-muted)' }}>
                    <Edit size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(budget.id, budget.name)}
                    title="Supprimer"
                    className="bg-transparent border-none cursor-pointer p-0"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={totalPages}
              total={meta.total}
              onPrev={() => router.visit(`/backend/project_budgets?page=${meta.page - 1}`)}
              onNext={() => router.visit(`/backend/project_budgets?page=${meta.page + 1}`)}
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

BudgetsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default BudgetsIndex
