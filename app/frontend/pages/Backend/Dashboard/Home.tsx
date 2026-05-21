import type { ReactNode } from 'react'
import { Sprout, Map as MapIcon, Activity, CalendarClock, UserCog, Layers, PawPrint, AlertTriangle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { KpiCard } from '../../../components/dashboard/KpiCard'
import { WeatherWidget } from '../../../components/dashboard/WeatherWidget'
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed'
import { ParcellesMap } from '../../../components/dashboard/ParcellesMap'
import type { DashboardHomeProps, DashboardAlert } from '../../../types/dashboard'

function AlerteBadge({ type }: { type: DashboardAlert['type'] }) {
  if (type === 'intervention_overdue') {
    return (
      <span style={{ background: '#fef9c3', color: '#854d0e', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
        Retard
      </span>
    )
  }
  return (
    <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
      Décès
    </span>
  )
}

function Home({ kpis, parcelles, recent_activity, weather, farm, alerts }: DashboardHomeProps) {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '24px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        {farm.name}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard title="Campagne"                value={kpis.campaign?.name ?? null} icon={<Sprout size={16} />} />
        <KpiCard title="Surfaces cultivées"      value={kpis.area_ha}                unit="ha" icon={<MapIcon size={16} />} />
        <KpiCard title="Interventions actives"   value={kpis.interventions.active}   icon={<Activity size={16} />} />
        <KpiCard title="Interventions planifiées" value={kpis.interventions.scheduled} icon={<CalendarClock size={16} />} />
        <KpiCard title="Travailleurs actifs"     value={kpis.workers_count}          icon={<UserCog size={16} />} />
        <KpiCard title="Productions"             value={kpis.productions_count}      icon={<Layers size={16} />} />
        <KpiCard title="Animaux vivants"         value={kpis.animals_count}          icon={<PawPrint size={16} />} />
      </div>

      {alerts.length > 0 && (
        <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff5f5', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', margin: 0 }}>
              Alertes
            </h2>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((alert, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: idx < alerts.length - 1 ? '1px solid #fecaca' : 'none' }}>
                <AlerteBadge type={alert.type} />
                <a href={alert.href} style={{ fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none', flexGrow: 1 }}>
                  {alert.label}
                </a>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {alert.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <ParcellesMap parcelles={parcelles} />
        <WeatherWidget weather={weather} />
      </div>

      <ActivityFeed interventions={recent_activity} />
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default Home
