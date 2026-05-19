import type { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users, Tractor, UserCog, PawPrint, Activity, ShoppingCart,
} from 'lucide-react'
import type { InertiaSharedProps } from '../types/shared'

const NAV_LINKS = [
  { href: '/backend',                      label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/backend/interventions',        label: 'Interventions', icon: Wrench },
  { href: '/backend/cultivable-zones',     label: 'Parcelles',    icon: Map },
  { href: '/backend/activity_productions', label: 'Productions',  icon: Sprout },
  { href: '/backend/journal_entries',      label: 'Comptabilité', icon: BookOpen },
  { href: '/backend/campaigns',            label: 'Campagnes',    icon: Calendar },
  { href: '/backend/sales',                label: 'Ventes',       icon: ShoppingCart },
  { href: '/backend/activities',           label: 'Activités',    icon: Activity },
  { href: '/backend/entities',             label: 'Entités',      icon: Users },
  { href: '/backend/equipments',           label: 'Équipements',  icon: Tractor },
  { href: '/backend/workers',              label: 'Travailleurs', icon: UserCog },
  { href: '/backend/animals',              label: 'Animaux',      icon: PawPrint },
]

interface AppShellComponentProps {
  children: ReactNode
}

export const AppShell = ({ children }: AppShellComponentProps) => {
  const { props, url } = usePage<InertiaSharedProps>()
  const { appShell } = props
  const campaign = appShell?.campaign
  const user = appShell?.user

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* TOPBAR */}
      <div style={{
        height: '44px',
        background: '#1e3a16',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', background: '#6B9E3F',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px',
          }}>S</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>SenagrOS</span>
        </div>

        {campaign && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#2d5a20', borderRadius: '4px', padding: '4px 10px',
          }}>
            <span style={{ color: '#9dc96b', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Campagne
            </span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>
              {campaign.name}
            </span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ lineHeight: 1.3, textAlign: 'right' }}>
                <div style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>{user.name}</div>
              </div>
              <div style={{
                width: '30px', height: '30px', background: '#4a7a3a',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600,
              }}>
                {user.initials}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <nav style={{
          width: '200px',
          background: '#2D4A22',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '0 12px',
            fontSize: '9px',
            color: '#6B9E3F',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
            fontWeight: 600,
          }}>
            Navigation
          </div>

          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/backend'
              ? url === '/backend' || url === '/backend/'
              : url === href || url.startsWith(href + '/') || url.startsWith(href + '?')

            return (
              <a
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '1px 8px',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  background: isActive ? '#3d6130' : 'transparent',
                  color: isActive ? '#fff' : '#9dc96b',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={14} />
                {label}
              </a>
            )
          })}

          <div style={{
            margin: '12px 12px 8px',
            borderTop: '1px solid #3d6130',
            paddingTop: '10px',
          }}>
            <div style={{
              fontSize: '9px', color: '#6B9E3F', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '6px', fontWeight: 600,
            }}>
              Outils
            </div>
            <a
              href="/backend/settings/about"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 10px', borderRadius: '5px',
                color: '#6d9460', textDecoration: 'none', fontSize: '11px',
              }}
            >
              <Settings size={13} />
              Paramètres
            </a>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
