import type { ReactNode } from 'react'
import {
  Sprout, Map as MapIcon, Activity, CalendarClock, UserCog, Layers,
  PawPrint, AlertTriangle, Wallet, ChevronRight, Download, Plus,
} from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { KpiCard } from '../../../components/dashboard/KpiCard'
import { WeatherWidget } from '../../../components/dashboard/WeatherWidget'
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed'
import { ParcellesMap } from '../../../components/dashboard/ParcellesMap'
import type { DashboardHomeProps, DashboardAlert } from '../../../types/dashboard'

function AlerteBadge({ type }: { type: DashboardAlert['type'] }) {
  if (type === 'intervention_overdue') {
    return (
      <span style={{
        background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)',
        borderRadius: '4px', padding: '2px 8px',
        fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
      }}>
        Retard
      </span>
    )
  }
  return (
    <span style={{
      background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)',
      borderRadius: '4px', padding: '2px 8px',
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      Décès
    </span>
  )
}

function Home({ kpis, parcelles, recent_activity, weather, farm, alerts }: DashboardHomeProps) {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>

      {/* ── PAGE TITLE ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {farm.name}
          </h1>
          {kpis.campaign && (
            <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Campagne {kpis.campaign.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-bg-card)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 1px 2px rgba(44, 36, 22, 0.05)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            <Download size={14} />
            Rapport
          </button>
          <a
            href="/backend/interventions/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(180deg, #1B6B3A 0%, #155829 100%)',
              color: '#fff',
              border: '1px solid #143F22',
              boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 3px rgba(0,0,0,0.15)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} />
            Nouvelle intervention
          </a>
        </div>
      </div>

      {/* ── KPI GRID — 4 columns ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '22px',
      }}>
        <KpiCard
          title="Surfaces cultivées"
          value={kpis.area_ha}
          unit="ha"
          icon={<MapIcon size={14} />}
          accent="#1B6B3A"
        />
        <KpiCard
          title="Interventions actives"
          value={kpis.interventions.active}
          icon={<Activity size={14} />}
          accent="#D4841A"
        />
        <KpiCard
          title="Productions"
          value={kpis.productions_count}
          icon={<Layers size={14} />}
          accent="#4CAF72"
        />
        <KpiCard
          title="Dépenses campagne"
          value={kpis.expenses_xof}
          unit="XOF"
          icon={<Wallet size={14} />}
          accent="#D4420A"
        />
        <KpiCard
          title="Campagne"
          value={kpis.campaign?.name ?? null}
          icon={<Sprout size={14} />}
          accent="#1B6B3A"
        />
        <KpiCard
          title="Interventions planifiées"
          value={kpis.interventions.scheduled}
          icon={<CalendarClock size={14} />}
          accent="#6B5E4E"
        />
        <KpiCard
          title="Travailleurs actifs"
          value={kpis.workers_count}
          icon={<UserCog size={14} />}
          accent="#1f6f8b"
        />
        <KpiCard
          title="Animaux vivants"
          value={kpis.animals_count}
          icon={<PawPrint size={14} />}
          accent="#D4841A"
        />
      </div>

      {/* ── ALERT PANEL ────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: '10px',
          padding: '16px 18px',
          marginBottom: '22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--color-danger-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertTriangle size={16} color="var(--color-danger)" />
            </div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-danger-text)', margin: 0, fontFamily: 'var(--font-ui)' }}>
              {alerts.length} alerte{alerts.length > 1 ? 's' : ''} à traiter
            </h2>
            <a
              href="/backend/alerts"
              style={{
                marginLeft: 'auto',
                fontSize: '12px', fontWeight: 600,
                color: 'var(--color-primary)', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}
            >
              Tout voir <ChevronRight size={13} />
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {alerts.map((alert, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '6px',
                border: '1px solid rgba(252,165,165,0.4)',
              }}>
                <AlerteBadge type={alert.type} />
                <a
                  href={alert.href}
                  style={{ fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none', flexGrow: 1, fontSize: '13px' }}
                >
                  {alert.label}
                </a>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {alert.detail}
                </span>
                <button style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: '#fff', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-muted)', flexShrink: 0,
                }}>
                  <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAP + WEATHER ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '22px' }}>
        <ParcellesMap parcelles={parcelles} />
        <WeatherWidget weather={weather} />
      </div>

      {/* ── ACTIVITY FEED ───────────────────────────────────────────── */}
      <ActivityFeed interventions={recent_activity} />
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default Home
