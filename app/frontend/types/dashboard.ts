export interface Campaign {
  name: string
  started_on: string
  stopped_on: string | null
}

export interface KpiData {
  campaign: Campaign | null
  area_ha: number
  interventions: { active: number; scheduled: number }
  expenses_xof: number | null
  workers_count: number
  productions_count: number
}

export interface Parcelle {
  id: number
  name: string
  area_ha: number
  geojson: string // Raw GeoJSON string — parse with JSON.parse() in component
}

export interface RecentIntervention {
  id: number
  name: string
  state: 'in_progress' | 'done' | 'planned'
  started_at: string
}

export interface WeatherDay {
  day: string
  temp_max: number
  temp_min: number
  icon: string
}

export interface WeatherData {
  temperature: number
  description: string
  icon: string
  forecast: WeatherDay[]
}

export interface FarmInfo {
  name: string
  locale: string
  timezone: string
}

export interface DashboardHomeProps {
  kpis: KpiData
  parcelles: Parcelle[]
  recent_activity: RecentIntervention[]
  weather: WeatherData | null
  farm: FarmInfo
}
