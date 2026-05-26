import type { ReactNode } from 'react'
import { useState, useMemo } from 'react'
import { Plus, Sprout, PawPrint, Grape, Wrench, Star } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, DataTable, StateBadge, PrimaryButton, FilterBar } from '../../../components/ui'
import type { ActivitesIndexProps, Activite } from '../../../types/activite'

const FAMILY_CFG: Record<string, { label: string; color: string; bg: string; Icon: typeof Sprout }> = {
  vine_farming:          { label: 'Viticulture',   color: '#7c3aed', bg: '#ede9fe',                       Icon: Grape },
  animal_farming:        { label: 'Élevage',       color: 'var(--color-warning)',  bg: 'var(--color-warning-bg)', Icon: PawPrint },
  crop_farming:          { label: 'Culture',       color: 'var(--color-primary)',  bg: 'var(--color-success-bg)', Icon: Sprout },
  equipment_maintenance: { label: 'Maintenance',   color: 'var(--color-info)',     bg: 'var(--color-info-bg)',    Icon: Wrench },
}

function getFamilyCfg(family: string) {
  return FAMILY_CFG[family] ?? { label: family, color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)', Icon: Star }
}

function ActivitesIndex({ activites, meta }: ActivitesIndexProps) {
  const [familyFilter, setFamilyFilter] = useState('')
  const families = useMemo(() => [...new Set(activites.map(a => a.family))], [activites])
  const visible = familyFilter ? activites.filter(a => a.family === familyFilter) : activites

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Activités"
        subtitle={`${meta.total} activité${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/activities/new">
            <Plus size={14} /> Nouvelle activité
          </PrimaryButton>
        }
      />

      <FilterBar>
        <div className="flex gap-1.5 flex-wrap">
          {(['', ...families]).map(f => {
            const cfg = f ? getFamilyCfg(f) : null
            const active = familyFilter === f
            return (
              <button
                key={f || '_all'}
                type="button"
                onClick={() => setFamilyFilter(f)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer"
                style={{
                  background: active ? (cfg?.bg ?? 'var(--color-bg-highlight)') : 'var(--color-bg)',
                  borderColor: active ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-border)',
                  color: active ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-text-muted)',
                }}
              >
                {f ? getFamilyCfg(f).label : 'Toutes'}
              </button>
            )
          })}
        </div>
      </FilterBar>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name',   label: 'Activité' },
            { key: 'family', label: 'Famille' },
            { key: 'nature', label: 'Nature' },
            { key: 'state',  label: 'État' },
          ]}
          data={visible}
          emptyMessage="Aucune activité enregistrée"
          renderRow={(a: Activite, i) => {
            const cfg = getFamilyCfg(a.family)
            const { Icon } = cfg
            return (
              <tr
                key={a.id}
                className="border-b"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={13} />
                    </span>
                    <a href={`/backend/activities/${a.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                      {a.name}
                    </a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{a.nature || '—'}</td>
                <td className="px-3.5 py-2.5">
                  <StateBadge
                    label={a.suspended ? 'Suspendue' : 'Active'}
                    color={a.suspended ? 'var(--color-danger)' : 'var(--color-primary)'}
                    bg={a.suspended ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}
                  />
                </td>
              </tr>
            )
          }}
        />
      </SectionCard>
    </div>
  )
}

ActivitesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default ActivitesIndex
