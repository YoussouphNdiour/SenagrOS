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

export interface EntiteShowProps {
  entite: {
    id: number
    nature: string
    full_name: string
    last_name: string
    first_name: string
    number: string
    title: string
    active: boolean
    born_at: string | null
    dead_at: string | null
    client: boolean
    supplier: boolean
    transporter: boolean
    prospect: boolean
    vat_subjected: boolean
    description: string
    language: string
    country: string
    currency: string
    vat_number: string
    siret_number: string
  }
}
