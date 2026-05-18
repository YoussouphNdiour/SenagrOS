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

export interface EntiteEmail {
  id: number | null
  coordinate: string
}

export interface EntitePhone {
  id: number | null
  coordinate: string
}

export interface EntiteMail {
  id: number | null
  mail_line_4: string
  mail_line_6: string
  mail_country: string
}

export interface EntiteFormData {
  id: number
  nature: string
  title: string
  first_name: string
  last_name: string
  born_at: string | null
  dead_at: string | null
  language: string
  description: string
  emails: EntiteEmail[]
  phones: EntitePhone[]
  mails: EntiteMail[]
}

export interface EntiteFormProps {
  entite: EntiteFormData | null
  errors: Record<string, string>
}

export interface AddressFormData {
  id: number | null
  canal: string
  coordinate: string
  mail_line_4: string
  mail_line_6: string
  mail_country: string
}

export interface AddressFormProps {
  address: AddressFormData | null
  entity_id: number
  errors: Record<string, string>
}
