export interface Activite {
  id: number
  name: string
  family: string
  nature: string
  suspended: boolean
}

export interface ActivitesIndexProps {
  activites: Activite[]
  meta: { total: number }
}

export interface ActiviteProduction {
  id: number
  name: string
  state: string
  started_on: string | null
  stopped_on: string | null
  cultivable_zone_name: string
  campaign_name: string
}

export interface ActiviteShowProps {
  activite: {
    id: number
    name: string
    description: string
    family: string
    nature: string
    suspended: boolean
    production_cycle: string
    with_supports: boolean
    with_cultivation: boolean
    support_variety: string
    cultivation_variety: string
    production_started_on: string | null
    production_stopped_on: string | null
    productions_count: number
  }
  productions: ActiviteProduction[]
}
