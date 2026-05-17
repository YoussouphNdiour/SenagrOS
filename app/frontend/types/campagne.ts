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
