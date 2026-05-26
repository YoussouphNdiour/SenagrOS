import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, UserCog } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, StateBadge, Pagination, PrimaryButton, EmptyState } from '../../../components/ui'
import type { TravailleursIndexProps } from '../../../types/travailleur'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

const AVATAR_COLORS = [
  'var(--color-primary)', 'var(--color-warning)', 'var(--color-info)',
  '#7c3aed', 'var(--color-text-muted)', 'var(--color-danger)',
]

function TravailleursIndex({ travailleurs, meta }: TravailleursIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const active = travailleurs.filter(t => !t.dead_at).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Travailleurs"
        subtitle={`${meta.total} travailleur${meta.total !== 1 ? 's' : ''} · ${active} actif${active !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/workers/new">
            <Plus size={14} /> Nouveau travailleur
          </PrimaryButton>
        }
      />

      {travailleurs.length === 0 ? (
        <EmptyState icon={UserCog} message="Aucun travailleur enregistré" />
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {travailleurs.map((w, i) => {
            const isActive = !w.dead_at
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!
            return (
              <a
                key={w.id}
                href={`/backend/workers/${w.id}`}
                className="flex items-center gap-3.5 no-underline rounded-[var(--radius-card)] p-4"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = 'var(--shadow-elev)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'var(--shadow-card)'
                }}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-bold"
                    style={{ background: `${color}1a`, color, fontFamily: 'var(--font-heading)' }}
                  >
                    {initials(w.name)}
                  </div>
                  {isActive && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-bg-card)' }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{w.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {w.work_number || w.number || 'N° non défini'}
                    {w.born_at && ` · Né(e) le ${formatDate(w.born_at)}`}
                  </div>
                </div>
                <StateBadge
                  label={isActive ? 'Actif' : 'Inactif'}
                  color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  bg={isActive ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
                />
              </a>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-2">
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/workers?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/workers?page=${meta.page + 1}`)}
          />
        </div>
      )}
    </div>
  )
}

TravailleursIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default TravailleursIndex
