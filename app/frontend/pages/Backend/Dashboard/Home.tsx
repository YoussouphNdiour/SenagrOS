import type { ReactNode } from 'react'
import { Sprout, Map as MapIcon, Activity, CalendarClock } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { KpiCard } from '../../../components/dashboard/KpiCard'
import { WeatherWidget } from '../../../components/dashboard/WeatherWidget'
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed'
import { ParcellesMap } from '../../../components/dashboard/ParcellesMap'
import type { DashboardHomeProps } from '../../../types/dashboard'

export const Home = ({ kpis, parcelles, recent_activity, weather, farm }: DashboardHomeProps) => {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-text)',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '24px',
        }}
      >
        {farm.name}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <KpiCard
          title="Campagne"
          value={kpis.campaign?.name ?? null}
          icon={<Sprout size={16} />}
        />
        <KpiCard
          title="Surfaces cultivées"
          value={kpis.area_ha}
          unit="ha"
          icon={<MapIcon size={16} />}
        />
        <KpiCard
          title="Interventions actives"
          value={kpis.interventions.active}
          icon={<Activity size={16} />}
        />
        <KpiCard
          title="Interventions planifiées"
          value={kpis.interventions.scheduled}
          icon={<CalendarClock size={16} />}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <ParcellesMap parcelles={parcelles} />
        <WeatherWidget weather={weather} />
      </div>

      <ActivityFeed interventions={recent_activity} />
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Home
