// app/frontend/pages/Backend/Achats/FacturesIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import { PageHeader, SectionCard, FilterBar, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { FacturesIndexProps, ReconciliationState } from '../../../types/achat'

const RECONCILIATION_CONFIG: Record<ReconciliationState, { label: string; color: string; bg: string; border: string }> = {
  to_reconcile: { label: 'À réconcilier', color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)', border: 'var(--color-border)' },
  reconcile:    { label: 'Réconciliée',   color: 'var(--color-primary)',      bg: 'var(--color-success-bg)', border: 'var(--color-primary)' },
  accepted:     { label: 'Acceptée',      color: 'var(--color-info)',         bg: 'var(--color-info-bg)',    border: 'var(--color-info)' },
}

function formatXOF(n: number) {
  return n.toLocaleString('fr-FR').replace(/\u00A0/g, '\u2009') + ' XOF'
}

export default function FacturesIndex({ factures, filters, meta }: FacturesIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [unpaid, setUnpaid] = useState(filters.unpaid ?? false)

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    router.get('/backend/purchase_invoices', { q, reconciliation_state: filters.reconciliation_state, unpaid }, { preserveState: true })
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la facture ${number} ?`)) {
      router.delete(`/backend/purchase_invoices/${id}`)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Achats"
        subtitle={`${meta.total_count} facture${meta.total_count !== 1 ? 's' : ''} fournisseur`}
        action={
          <PrimaryButton href="/backend/purchase_invoices/new">
            <Plus size={14} /> Nouvelle facture
          </PrimaryButton>
        }
      />

      <AchatsTabs />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="N°, référence, fournisseur…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
        </div>

        <select
          value={filters.reconciliation_state?.[0] ?? ''}
          onChange={e => {
            const val = e.target.value as ReconciliationState
            router.get('/backend/purchase_invoices', { q, reconciliation_state: val ? [val] : [], unpaid }, { preserveState: true })
          }}
          className="px-2.5 py-1.5 text-sm rounded-lg cursor-pointer"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <option value="">Tous les états</option>
          <option value="to_reconcile">À réconcilier</option>
          <option value="reconcile">Réconciliée</option>
          <option value="accepted">Acceptée</option>
        </select>

        <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
          <input
            type="checkbox"
            checked={unpaid}
            onChange={e => {
              setUnpaid(e.target.checked)
              router.get('/backend/purchase_invoices', { q, reconciliation_state: filters.reconciliation_state, unpaid: e.target.checked }, { preserveState: true })
            }}
          />
          Non payées uniquement
        </label>

        <button
          type="button"
          onClick={search}
          className="px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Chercher
        </button>
      </FilterBar>

      <SectionCard noPadding>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              {['N° facture', 'Référence', 'Fournisseur', 'État', 'Date facture', 'HT', 'TTC', ''].map(h => (
                <th
                  key={h}
                  className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b"
                  style={{ textAlign: h === 'HT' || h === 'TTC' ? 'right' : 'left', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factures.map((f, i) => {
              const cfg = RECONCILIATION_CONFIG[f.reconciliation_state]
              return (
                <tr
                  key={f.id}
                  className="border-b"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
                >
                  <td className="px-3.5 py-2.5 text-sm">
                    <a href={`/backend/purchase_invoices/${f.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{f.number}</a>
                  </td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{f.reference_number ?? '—'}</td>
                  <td className="px-3.5 py-2.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{f.supplier.full_name}</td>
                  <td className="px-3.5 py-2.5">
                    {cfg && <StateBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} />}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(f.invoiced_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm font-medium tabular-nums whitespace-nowrap text-right" style={{ color: 'var(--color-text)' }}>{formatXOF(f.pretax_amount)}</td>
                  <td className="px-3.5 py-2.5 text-sm font-bold tabular-nums whitespace-nowrap text-right" style={{ color: 'var(--color-text)' }}>{formatXOF(f.amount)}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex gap-2 items-center">
                      {f.updatable && (
                        <a href={`/backend/purchase_invoices/${f.id}/edit`} title="Modifier" style={{ color: 'var(--color-text-muted)' }}>
                          <Pencil size={14} />
                        </a>
                      )}
                      {f.destroyable && (
                        <button
                          type="button"
                          onClick={() => handleDelete(f.id, f.number)}
                          className="bg-transparent border-none cursor-pointer p-0"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {factures.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Aucune facture fournisseur
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {meta.total_pages > 1 && (
          <Pagination
            page={meta.current_page}
            totalPages={meta.total_pages}
            total={meta.total_count}
            onPrev={() => router.get('/backend/purchase_invoices', { q, reconciliation_state: filters.reconciliation_state, unpaid, page: meta.current_page - 1 }, { preserveState: true })}
            onNext={() => router.get('/backend/purchase_invoices', { q, reconciliation_state: filters.reconciliation_state, unpaid, page: meta.current_page + 1 }, { preserveState: true })}
          />
        )}
      </SectionCard>
    </div>
  )
}

FacturesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
