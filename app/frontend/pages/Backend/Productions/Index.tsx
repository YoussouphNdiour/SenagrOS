import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Sprout, Activity, CheckCircle, List, BarChart2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton, ViewToggle } from '../../../components/ui'
import { GanttView } from '../../../components/productions/GanttView'
import type { ProductionsIndexProps, Production } from '../../../types/production'

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  opened:  { label: 'En cours',   color: 'var(--color-primary)',    bg: 'var(--color-success-bg)' },
  closed:  { label: 'Terminée',   color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' },
  aborted: { label: 'Abandonnée', color: 'var(--color-danger)',     bg: 'var(--color-danger-bg)' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProductionsIndex({ productions, meta }: ProductionsIndexProps) {
  const [view, setView] = useState<'list' | 'gantt'>('list')
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const enCours = productions.filter(p => p.state === 'opened').length
  const terminees = productions.filter(p => p.state === 'closed').length
  const families = [...new Set(productions.map(p => p.activity?.family).filter(Boolean))]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="flex justify-between items-start mb-5 gap-4">
        <div>
          <h1 className="text-[26px] font-bold m-0 leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Productions
          </h1>
          <p className="mt-1 text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
            {meta.total} production{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ViewToggle
            views={[
              { key: 'list',  label: 'Liste', icon: List },
              { key: 'gantt', label: 'Gantt', icon: BarChart2 },
            ]}
            active={view}
            onChange={(k) => setView(k as 'list' | 'gantt')}
          />
          <PrimaryButton href="/backend/activity_productions/new">
            <Plus size={14} /> Nouvelle production
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KpiCard icon={<Sprout size={16} />}     label="Total"     value={meta.total}       color="var(--color-primary)" />
        <KpiCard icon={<Activity size={16} />}    label="En cours"  value={enCours}          color="var(--color-warning)" />
        <KpiCard icon={<CheckCircle size={16} />} label="Terminées" value={terminees}        color="var(--color-info)" />
        <KpiCard icon={<Sprout size={16} />}      label="Familles"  value={families.length}  color="var(--color-text-muted)" />
      </div>

      {view === 'gantt' ? (
        <SectionCard noPadding>
          <GanttView productions={productions} />
        </SectionCard>
      ) : (
        <SectionCard noPadding>
          <DataTable
            columns={[
              { key: 'name',     label: 'Production' },
              { key: 'activity', label: 'Activité' },
              { key: 'dates',    label: 'Période' },
              { key: 'state',    label: 'État' },
            ]}
            data={productions}
            emptyMessage="Aucune production enregistrée"
            renderRow={(p: Production, i) => {
              const s = STATE_CONFIG[p.state] ?? { label: p.state, color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' }
              return (
                <tr
                  key={p.id}
                  className="border-b"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
                >
                  <td className="px-3.5 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-success-bg)', color: 'var(--color-primary)' }}>
                        <Sprout size={13} />
                      </span>
                      <a href={`/backend/activity_productions/${p.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{p.name}</a>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.activity?.name || '—'}</td>
                  <td className="px-3.5 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(p.started_on)} → {formatDate(p.stopped_on)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <StateBadge label={s.label} color={s.color} bg={s.bg} />
                  </td>
                </tr>
              )
            }}
          />
          {totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={totalPages}
              total={meta.total}
              onPrev={() => router.visit(`/backend/activity_productions?page=${meta.page - 1}`)}
              onNext={() => router.visit(`/backend/activity_productions?page=${meta.page + 1}`)}
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

ProductionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default ProductionsIndex
