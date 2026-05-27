export interface Campagne {
  id: number
  name: string
  harvest_year: number
  closed: boolean
}

export interface CampagnesIndexProps {
  campagnes: Campagne[]
  meta: { total: number }
}

export interface CampagneProduction {
  id: number
  name: string
  state: string
  started_on: string | null
  stopped_on: string | null
  activity_name: string
  cultivable_zone_name: string
}

export interface CampagneShowProps {
  campagne: {
    id: number
    name: string
    description: string
    harvest_year: number
    closed: boolean
    closed_at: string | null
    created_at: string | null
  }
  productions: CampagneProduction[]
  canDestroy: boolean
}
