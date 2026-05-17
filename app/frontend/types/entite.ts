export interface Entite {
  id: number
  number: string
  full_name: string
  nature: string
  active: boolean
  client: boolean
  supplier: boolean
}

export interface EntitesIndexProps {
  entites: Entite[]
  meta: { total: number; page: number; per_page: number }
}
