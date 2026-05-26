import type { ReactNode } from 'react'
import { useState } from 'react'
import { Search, LayoutList, Kanban, Map, Plus, Check, Loader, ShieldCheck, Calendar } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { InterventionMap } from '../../../components/interventions/InterventionMap'
import { useInterventionFilters } from '../../../hooks/useInterventionFilters'
import { PageHeader, SectionCard, FilterBar, StateBadge, Pagination, PrimaryButton, ViewToggle } from '../../../components/ui'
import type { InterventionIndexProps, InterventionState } from '../../../types/intervention'

type View = 'list' | 'kanban' | 'map'

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof Check }> = {
  in_progress: { label: 'En cours',  color: 'var(--color-warning)',      bg: 'var(--color-warning-bg)',   border: 'var(--color-border)', Icon: Loader },
  done:        { label: 'Terminée',  color: 'var(--color-success)',      bg: 'var(--color-success-bg)',   border: 'var(--color-border)', Icon: Check },
  validated:   { label: 'Validée',   color: 'var(--color-primary)',      bg: 'var(--color-bg-highlight)', border: 'var(--color-border)', Icon: ShieldCheck },
  rejected:    { label: 'Rejetée',   color: 'var(--color-danger)',       bg: 'var(--color-danger-bg)',    border: 'var(--color-danger-border)', Icon: Check },
}

const KANBAN_COLS = [
  { key: 'planned',     label: 'Planifié',   color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)' },
  { key: 'in_progress', label: 'En cours',   color: 'var(--color-warning)',    bg: 'var(--color-warning-bg)' },
  { key: 'done',        label: 'Terminé',    color: 'var(--color-primary)',    bg: 'var(--color-success-bg)' },
  { key: 'validated',   label: 'Validé',     color: 'var(--color-info)',       bg: 'var(--color-info-bg)' },
]

function InterventionsIndex({ interventions, kanban, map_geojson, filters, meta }: InterventionIndexProps) {
  const [view, setView] = useState<View>('list')
  const { applyFilters } = useInterventionFilters(filters)

  const totalPages = Math.ceil(meta.total / meta.per_page)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Interventions"
        subtitle={`${meta.total} intervention${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/interventions/new">
            <Plus size={14} /> Nouvelle intervention
          </PrimaryButton>
        }
      />

      <FilterBar>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher une intervention…"
            defaultValue={filters.q ?? ''}
            onChange={e => applyFilters({ q: e.target.value, page: 1 })}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
        </div>

        <select
          defaultValue={filters.state?.[0] ?? ''}
          onChange={e => applyFilters({ state: e.target.value ? [e.target.value] : [], page: 1 })}
          className="px-2.5 py-1.5 text-sm rounded-lg cursor-pointer"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <option value="">Tous les états</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminées</option>
          <option value="validated">Validées</option>
          <option value="rejected">Rejetées</option>
        </select>

        <select
          defaultValue={filters.procedure_name_id?.[0] ?? ''}
          onChange={e => applyFilters({ procedure_name_id: e.target.value ? [e.target.value] : [], page: 1 })}
          className="px-2.5 py-1.5 text-sm rounded-lg cursor-pointer"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <option value="">Toutes les procédures</option>
          {meta.procedures.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </FilterBar>

      <div className="mb-4">
        <ViewToggle
          views={[
            { key: 'list',   label: 'Liste',   icon: LayoutList },
            { key: 'kanban', label: 'Tableau',  icon: Kanban },
            { key: 'map',    label: 'Carte',    icon: Map },
          ]}
          active={view}
          onChange={k => setView(k as View)}
        />
      </div>

      {view === 'map' && (
        <SectionCard noPadding className="mb-4">
          <InterventionMap geojson={map_geojson} />
        </SectionCard>
      )}

      {view === 'kanban' && (
        <div className="grid grid-cols-4 gap-3.5">
          {KANBAN_COLS.map(col => {
            const count = kanban[col.key as keyof typeof kanban] ?? 0
            return (
              <div
                key={col.key}
                className="rounded-[var(--radius-card)] p-4"
                style={{
                  background: 'var(--color-bg-card)',
                  border: `1px solid var(--color-border)`,
                  borderTop: `2px solid ${col.color}`,
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: col.color }}>{col.label}</span>
                  <span className="rounded-full px-2 py-0.5 text-sm font-bold" style={{ background: col.bg, color: col.color, fontFamily: 'var(--font-heading)' }}>
                    {count}
                  </span>
                </div>
                <p className="text-xs m-0" style={{ color: 'var(--color-text-muted)' }}>
                  intervention{count !== 1 ? 's' : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {view === 'list' && (
        <SectionCard noPadding>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                {['Nom', 'Procédure', 'Cible', 'Zone', 'Durée', 'Date', 'État'].map(h => (
                  <th
                    key={h}
                    className="px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest border-b"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention, i) => {
                const cfg = STATE_CONFIG[intervention.state as InterventionState]
                return (
                  <tr
                    key={intervention.id}
                    className="border-b"
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
                  >
                    <td className="px-3.5 py-2.5 text-sm">
                      <a href={`/backend/interventions/${intervention.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                        {intervention.name}
                      </a>
                    </td>
                    <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{intervention.procedure_name}</td>
                    <td className="px-3.5 py-2.5 text-sm max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--color-text)' }}>{intervention.human_target_names}</td>
                    <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{intervention.human_working_zone_area}</td>
                    <td className="px-3.5 py-2.5 text-sm tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{intervention.human_working_duration}</td>
                    <td className="px-3.5 py-2.5 text-sm tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(intervention.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {cfg ? (
                        <StateBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} />
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{intervention.state}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {interventions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Aucune intervention trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={totalPages}
              total={meta.total}
              onPrev={() => applyFilters({ page: meta.page - 1 })}
              onNext={() => applyFilters({ page: meta.page + 1 })}
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

InterventionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default InterventionsIndex
