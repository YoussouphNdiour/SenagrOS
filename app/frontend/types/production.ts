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
