export type InterventionState  = 'in_progress' | 'done' | 'validated' | 'rejected'
export type InterventionNature = 'request' | 'record'

export interface Intervention {
  id: number
  procedure_name: string
  nature: InterventionNature
  state: InterventionState
  started_at: string
  stopped_at: string | null
  name: string
  human_activities_names: string
  human_target_names: string
  human_working_duration: string
  human_working_zone_area: string
}

export interface InterventionFilters {
  q?: string
  state?: string[]
  nature?: string[]
  cultivable_zone_id?: string
  procedure_name_id?: string[]
  activity_id?: string
  target_id?: string
  label_id?: string
  worker_id?: string
  equipment_id?: string
  period?: string
  period_interval?: 'day' | 'week' | 'month' | 'year'
  page?: number
}

export interface InterventionIndexProps {
  interventions: Intervention[]
  kanban: {
    planned:     number
    in_progress: number
    done:        number
    validated:   number
  }
  map_geojson: GeoJSON.FeatureCollection
  filters: InterventionFilters
  meta: {
    total:      number
    page:       number
    per_page:   number
    procedures: Array<{ label: string; value: string }>
  }
}
