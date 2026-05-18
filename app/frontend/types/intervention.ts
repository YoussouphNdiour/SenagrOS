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

export interface InterventionParticipant {
  id: number
  product_name: string
}

export interface InterventionInputItem extends InterventionParticipant {
  quantity_value: number
  quantity_unit: string
}

export interface InterventionShowProps {
  intervention: {
    id: number
    number: string
    procedure_name: string
    state: string
    nature: string
    started_at: string | null
    stopped_at: string | null
    description: string
    working_duration: number
    whole_duration: number
    request_compliant: boolean | null
  }
  targets: InterventionParticipant[]
  inputs: InterventionInputItem[]
  doers: InterventionParticipant[]
  tools: InterventionParticipant[]
}

export interface ProcedureParameter {
  name: string
  label: string
}

export interface ProcedureSchema {
  procedure_name: string
  label: string
  groups: {
    target: ProcedureParameter[]
    tool: ProcedureParameter[]
    doer: ProcedureParameter[]
    input: ProcedureParameter[]
    output: ProcedureParameter[]
  }
}

export interface InterventionFormData {
  id: number
  procedure_name: string
  nature: string
  state: string
  started_at: string | null
  stopped_at: string | null
  description: string
  number: string
}

export interface InterventionFormProps {
  intervention: InterventionFormData | null
  procedures: Array<{ label: string; name: string }>
  procedure_schema: ProcedureSchema | null
  errors: Record<string, string>
}
