export interface Parcelle {
  id: number
  name: string
  area_ha: number | null
  geojson: string | null
  canDestroy?: boolean
}

export interface ParcellesIndexProps {
  parcelles: Parcelle[]
  meta: { total: number }
}

export interface ParcelleProduction {
  id: number
  name: string
  state: string
  started_on: string | null
  stopped_on: string | null
}

export interface ParcelleShowProps {
  parcelle: {
    id: number
    name: string
    work_number: string
    description: string
    soil_nature: string
    production_system_name: string
    area_ha: number | null
    geojson: string | null
    owner_name: string
    farmer_name: string
    created_at: string | null
  }
  productions: ParcelleProduction[]
  canDestroy: boolean
}
