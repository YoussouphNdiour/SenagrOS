import type { ReactNode } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, StateBadge, ProgressBar, PrimaryButton } from '../../../components/ui'
import type { CampagnesIndexProps } from '../../../types/campagne'

function CampagnesIndex({ campagnes, meta }: CampagnesIndexProps) {
  const enCours = campagnes.filter(c => !c.closed).length
  const cloturees = campagnes.filter(c => c.closed).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Campagnes"
        subtitle={`${meta.total} campagne${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/campaigns/new">
            <Plus size={14} /> Nouvelle campagne
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard icon={<Calendar size={16} />} label="Total"     value={meta.total} color="var(--color-info)" />
        <KpiCard icon={<Calendar size={16} />} label="En cours"  value={enCours}    color="var(--color-primary)" />
        <KpiCard icon={<Calendar size={16} />} label="Clôturées" value={cloturees}  color="var(--color-text-muted)" />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {campagnes.map(c => (
          <a
            key={c.id}
            href={`/backend/campaigns/${c.id}`}
            className="no-underline rounded-[var(--radius-card)] p-4 block"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = 'var(--shadow-elev)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'var(--shadow-card)'
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {c.name}
              </span>
              <StateBadge
                label={c.closed ? 'Clôturée' : 'En cours'}
                color={c.closed ? 'var(--color-danger)' : 'var(--color-primary)'}
                bg={c.closed ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}
              />
            </div>
            {c.harvest_year && (
              <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Récolte {c.harvest_year}
              </div>
            )}
            <ProgressBar
              value={c.closed ? 1 : 0}
              max={1}
              fillColor={c.closed ? 'var(--color-text-muted)' : 'var(--color-primary)'}
              label={c.closed ? '100%' : 'En cours'}
            />
          </a>
        ))}
      </div>
    </div>
  )
}

CampagnesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default CampagnesIndex
