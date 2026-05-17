export interface Parcelle {
  id: number
  name: string
  area_ha: number | null
  geojson: string | null
}

export interface ParcellesIndexProps {
  parcelles: Parcelle[]
  meta: { total: number }
}
