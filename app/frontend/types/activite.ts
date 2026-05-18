export interface Activite {
  id: number
  name: string
  family: string
  nature: string
  suspended: boolean
}

export interface ActivitesIndexProps {
  activites: Activite[]
  meta: { total: number; page: number; per_page: number }
}

export interface ActiviteProduction {
  id: number
  name: string
  state: string
  started_on: string | null
  campaign_name: string
  cultivable_zone_name: string
}

export interface ActiviteDetail {
  id: number
  family: string
  name: string
  nature: string
  production_cycle: string
  with_supports: boolean
  suspended: boolean
  description: string
  with_cultivation: boolean
  support_variety: string
  cultivation_variety: string
  production_started_on: string | null
  production_stopped_on: string | null
  productions_count: number
}

export interface ActiviteShowProps {
  activite: ActiviteDetail
  productions: ActiviteProduction[]
}

export interface ActiviteFormData {
  id: number
  name: string
  nature: string
  family: string
  production_cycle: string
  with_supports: boolean
  suspended: boolean
  description: string
}

export interface ActiviteFormProps {
  activite: ActiviteFormData | null
  families: Array<{ value: string; label: string }>
  errors: Record<string, string>
}
