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

export interface ProductionShowProps {
  production: {
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
}
