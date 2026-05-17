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
