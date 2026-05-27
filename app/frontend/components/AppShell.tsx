import { useState, useRef, useEffect, type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users, Tractor,
  UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag, Package, Bell, Wallet,
  ChevronDown, ChevronRight, Search, LogOut, User, LifeBuoy, CheckCircle, AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import type { InertiaSharedProps } from '../types/shared'

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  count: number | null
  isAlert?: boolean
}

interface NavSection {
  label: string
  links: NavLink[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Pilotage',
    links: [
      { href: '/backend',                       label: 'Dashboard',     icon: LayoutDashboard, count: null },
      { href: '/backend/interventions',         label: 'Interventions', icon: Wrench,           count: null },
      { href: '/backend/cultivable-zones',      label: 'Parcelles',     icon: Map,              count: null },
      { href: '/backend/activity_productions',  label: 'Productions',   icon: Sprout,           count: null },
    ],
  },
  {
    label: 'Finance',
    links: [
      { href: '/backend/journal_entries',  label: 'Comptabilité', icon: BookOpen,     count: null },
      { href: '/backend/sales',            label: 'Ventes',        icon: ShoppingCart, count: null },
      { href: '/backend/purchase_orders',  label: 'Achats',        icon: ShoppingBag,  count: null },
      { href: '/backend/project_budgets',  label: 'Budgets',       icon: Wallet,       count: null },
    ],
  },
  {
    label: 'Ressources',
    links: [
      { href: '/backend/campaigns',   label: 'Campagnes',    icon: Calendar, count: null },
      { href: '/backend/activities',  label: 'Activités',    icon: Activity, count: null },
      { href: '/backend/entities',    label: 'Entités',       icon: Users,    count: null },
      { href: '/backend/equipments',  label: 'Équipements',  icon: Tractor,  count: null },
      { href: '/backend/workers',     label: 'Travailleurs', icon: UserCog,  count: null },
      { href: '/backend/animals',     label: 'Animaux',       icon: PawPrint, count: null },
      { href: '/backend/products',    label: 'Catalogue',    icon: Package,  count: null },
    ],
  },
  {
    label: 'Suivi',
    links: [
      { href: '/backend/alerts', label: 'Alertes', icon: Bell, count: null, isAlert: true },
    ],
  },
]

const ALL_NAV_LINKS = NAV_SECTIONS.flatMap(s => s.links)

interface NavItemProps {
  href: string
  label: string
  Icon: LucideIcon
  count: number | null
  isAlert?: boolean
  isActive: boolean
}

function NavItem({ href, label, Icon, count, isAlert, isActive }: NavItemProps) {
  const [hover, setHover] = useState(false)

  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '1px 10px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: isActive
          ? 'linear-gradient(180deg, #3d6130 0%, #34532a 100%)'
          : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: isActive ? '#FFFFFF' : hover ? '#c5e29a' : '#9dc96b',
        textDecoration: 'none',
        fontSize: '12px',
        fontWeight: isActive ? 600 : 500,
        boxShadow: isActive
          ? '0 1px 0 rgba(255,255,255,0.06) inset, 0 1px 3px rgba(0,0,0,0.18)'
          : 'none',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {isActive && (
        <span style={{
          position: 'absolute',
          left: -10,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: '0 3px 3px 0',
          background: '#E8A020',
        }} />
      )}
      <Icon size={14} />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && (
        <span style={{
          background: isAlert
            ? '#D4420A'
            : isActive ? 'rgba(232,160,32,0.9)' : 'rgba(232,160,32,0.18)',
          color: isAlert
            ? '#fff'
            : isActive ? '#1e3a16' : '#f5c66a',
          fontSize: '10px',
          fontWeight: 700,
          padding: '1px 7px',
          borderRadius: '999px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {count}
        </span>
      )}
    </a>
  )
}

interface UserDropdownProps {
  name: string
  initials: string
  onClose: () => void
}

function UserDropdown({ name, initials, onClose }: UserDropdownProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      right: 0,
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
      minWidth: '220px',
      padding: '6px',
      zIndex: 110,
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>{name}</div>
      </div>
      {[
        { Icon: User,    label: 'Mon profil',     href: '/backend/settings/about' },
        { Icon: Settings, label: 'Paramètres',    href: '/backend/settings/about' },
        { Icon: LifeBuoy, label: 'Aide & support', href: '#' },
      ].map(({ Icon, label, href }) => (
        <a
          key={label}
          href={href}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            color: 'var(--color-text)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 500,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Icon size={13} />
          {label}
        </a>
      ))}
      <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
      <a
        href="/users/sign_out"
        data-method="delete"
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '7px 10px',
          borderRadius: '6px',
          color: 'var(--color-danger)',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: 500,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <LogOut size={13} />
        Se déconnecter
      </a>
    </div>
  )
}

interface AppShellComponentProps {
  children: ReactNode
}

export const AppShell = ({ children }: AppShellComponentProps) => {
  const { props, url } = usePage<InertiaSharedProps>()
  const { appShell } = props
  const campaign = appShell?.campaign
  const user = appShell?.user
  const farm = appShell?.farm

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  const flash = props.flash ?? { notice: null, alert: null }
  const [visibleNotice, setVisibleNotice] = useState<string | null>(flash.notice ?? null)
  const [visibleAlert, setVisibleAlert] = useState<string | null>(flash.alert ?? null)

  useEffect(() => {
    setVisibleNotice(flash.notice ?? null)
    setVisibleAlert(flash.alert ?? null)
    if (flash.notice) {
      const t = setTimeout(() => setVisibleNotice(null), 4000)
      return () => clearTimeout(t)
    }
  }, [flash.notice, flash.alert])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <div style={{
        height: 'var(--layout-topbar-h)',
        background: 'linear-gradient(180deg, #1e3a16 0%, #1a3413 100%)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: '14px',
        flexShrink: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(0,0,0,0.25)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 12px rgba(0,0,0,0.18)',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6B9E3F 0%, #4a7a3a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 2px 6px rgba(0,0,0,0.2)',
          }}>S</div>
          <div style={{ whiteSpace: 'nowrap', lineHeight: 1.05 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>
              SenagrOS
            </div>
            {farm && (
              <div style={{ color: '#9dc96b', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '-1px' }}>
                {farm.name}
              </div>
            )}
          </div>
        </div>

        <span style={{ width: '1px', height: '24px', background: 'rgba(157,201,107,0.18)', flexShrink: 0 }} />

        {/* Campaign chip */}
        {campaign && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(157,201,107,0.12)',
            border: '1px solid rgba(157,201,107,0.18)',
            borderRadius: '999px',
            padding: '5px 12px 5px 8px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: '#4CAF72',
              boxShadow: '0 0 0 3px rgba(76,175,114,0.25)',
              flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ color: '#9dc96b', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Campagne
              </span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>
                {campaign.name}
              </span>
            </div>
            <ChevronDown size={12} color="#9dc96b" />
          </div>
        )}

        {/* Search bar */}
        <div style={{
          flex: 1,
          maxWidth: '360px',
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0,0,0,0.22)',
          border: '1px solid rgba(157,201,107,0.12)',
          borderRadius: '8px',
          padding: '6px 10px',
          cursor: 'pointer',
        }}>
          <Search size={13} color="#9dc96b" />
          <span style={{ color: '#9dc96b', fontSize: '12px', flex: 1 }}>Rechercher…</span>
          <span style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(157,201,107,0.18)',
            color: '#9dc96b',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            borderRadius: '4px',
            padding: '1px 5px',
          }}>⌘K</span>
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9dc96b',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Bell size={16} />
        </button>

        {/* User chip */}
        {user && (
          <div ref={userRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 4px',
                borderRadius: '999px',
                background: userMenuOpen ? 'rgba(157,201,107,0.18)' : 'rgba(157,201,107,0.08)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4a7a3a 0%, #6B9E3F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                position: 'relative',
                flexShrink: 0,
              }}>
                {user.initials}
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#4CAF72',
                  border: '2px solid #1e3a16',
                }} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{user.name}</div>
              </div>
              <ChevronDown
                size={12}
                color="#9dc96b"
                style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
              />
            </button>
            {userMenuOpen && (
              <UserDropdown
                name={user.name}
                initials={user.initials}
                onClose={() => setUserMenuOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <nav style={{
          width: 'var(--layout-sidebar-w)',
          background: 'linear-gradient(180deg, #2D4A22 0%, #243d1c 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 0',
          flexShrink: 0,
          overflowY: 'auto',
          borderRight: '1px solid rgba(0,0,0,0.15)',
        }}>
          {NAV_SECTIONS.map(section => {
            return (
              <div key={section.label}>
                {/* Section label */}
                <div style={{
                  padding: '0 16px',
                  fontSize: '9px',
                  color: '#6B9E3F',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  margin: '14px 0 6px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {section.label}
                  <span style={{
                    flex: 1,
                    height: '1px',
                    background: 'linear-gradient(90deg, #3d6130 0%, transparent 100%)',
                  }} />
                </div>

                {section.links.map(({ href, label, icon: Icon, count, isAlert }) => {
                  const isActive = href === '/backend'
                    ? url === '/backend' || url === '/backend/'
                    : url === href || url.startsWith(href + '/') || url.startsWith(href + '?')

                  return (
                    <NavItem
                      key={href}
                      href={href}
                      label={label}
                      Icon={Icon}
                      count={count}
                      isAlert={isAlert}
                      isActive={isActive}
                    />
                  )
                })}
              </div>
            )
          })}

          {/* Settings footer */}
          <div style={{ marginTop: 'auto', padding: '14px 16px 6px' }}>
            <a
              href="/backend/settings/about"
              style={{
                background: 'rgba(0,0,0,0.18)',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.28)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.18)' }}
            >
              <Settings size={14} color="#9dc96b" />
              <span style={{ color: '#9dc96b', fontSize: '11px', fontWeight: 500, flex: 1 }}>Paramètres</span>
              <ChevronRight size={12} color="#6d9460" />
            </a>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--layout-page-pad)' }}>
          {visibleNotice && (
            <div role="status" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
              background: 'var(--color-success-bg)', border: '1px solid var(--color-success-text)',
              color: 'var(--color-success-text)', fontSize: '14px',
            }}>
              <CheckCircle size={16} />
              {visibleNotice}
              <button onClick={() => setVisibleNotice(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>×</button>
            </div>
          )}
          {visibleAlert && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
              background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-text)',
              color: 'var(--color-danger-text)', fontSize: '14px',
            }}>
              <AlertTriangle size={16} />
              {visibleAlert}
              <button onClick={() => setVisibleAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>×</button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

// Suppress unused import warning — ALL_NAV_LINKS kept for external consumers
export { ALL_NAV_LINKS }
