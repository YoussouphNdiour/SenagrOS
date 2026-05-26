import type { ReactNode } from 'react'
import { Settings, Database, Globe, Server, Info } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { SettingsAboutProps } from '../../../types/settings'

function ParametresAbout({ app_info }: SettingsAboutProps) {
  const infoSections = [
    {
      icon: Server,
      title: 'Application',
      items: [
        { label: 'Version SenagrOS / Ekylibre', value: app_info.ekylibre_version || '—' },
        { label: 'Tenant', value: app_info.tenant || '—' },
      ],
    },
    {
      icon: Database,
      title: 'Base de données',
      items: [
        { label: 'Version schéma', value: app_info.db_version || '—' },
        { label: 'Version lexicon', value: app_info.lexicon_version || '—' },
      ],
    },
    {
      icon: Globe,
      title: 'Localisation',
      items: [
        { label: 'Langue', value: app_info.language || '—' },
        { label: 'Pays', value: app_info.country || '—' },
      ],
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: '40px', height: '40px', background: 'var(--color-success-bg)' }}
        >
          <Settings size={20} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Paramètres
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Informations système SenagrOS
          </p>
        </div>
      </div>

      {/* Info sections */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {infoSections.map(({ icon: Icon, title, items }) => (
          <div
            key={title}
            className="rounded-lg p-5"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Icon size={14} />
              {title}
            </h2>
            <dl className="space-y-3">
              {items.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {label}
                  </dt>
                  <dd
                    className="text-sm font-medium font-mono"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* About SenagrOS */}
      <div
        className="mt-5 rounded-lg p-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Info size={14} />
          À propos de SenagrOS
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
          SenagrOS est un système de gestion d&apos;informations agricoles (FMIS) adapté pour l&apos;Afrique de l&apos;Ouest,
          basé sur Ekylibre. Il permet la gestion des parcelles, cultures, élevages, interventions
          et comptabilité agricole.
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Basé sur{' '}
          <a
            href="https://ekylibre.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)' }}
          >
            Ekylibre
          </a>{' '}
          — Logiciel libre sous licence AGPL v3.
        </p>
      </div>
    </>
  )
}

ParametresAbout.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParametresAbout
