export interface Production {
  id: number
  name: string
  started_on: string
  stopped_on: string | null
  state: string
  activity:        { id: number; name: string; family: string }
  cultivable_zone: { id: number; name: string } | null
  campaign:        { id: number; name: string; harvest_year: number }
}

export interface ProductionsIndexProps {
  productions: Production[]
  meta: { total: number; page: number; per_page: number }
}

export interface ProductionIntervention {
  id: number
  name: string
  started_at: string | null
  state: string
}

export interface ProductionDetail {
  id: number
  name: string
  custom_name: string
  state: string
  started_on: string | null
  stopped_on: string | null
  usage: string
  size_value: number
  size_indicator_name: string
  size_unit_name: string
  irrigated: boolean
  nitrate_fixing: boolean
  rank_number: number
  activity_id: number | null
  activity_name: string
  activity_family: string
  cultivable_zone_id: number | null
  cultivable_zone_name: string
  campaign_id: number | null
  campaign_name: string
}

export interface ProductionShowProps {
  production: ProductionDetail
  interventions: ProductionIntervention[]
}

export interface ProductionFormData {
  id: number
  activity_id: number | null
  campaign_id: number | null
  cultivable_zone_id: number | null
  started_on: string | null
  stopped_on: string | null
  irrigated: boolean
  nitrate_fixing: boolean
  state: string
}

export interface ProductionFormProps {
  production: ProductionFormData | null
  activities: Array<{ id: number; name: string }>
  campaigns: Array<{ id: number; name: string }>
  cultivable_zones: Array<{ id: number; name: string }>
  errors: Record<string, string>
}
