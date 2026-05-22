import type { IssueItem } from './issue'

export type { IssueItem }

export type AlerteType = 'intervention_overdue' | 'animal_dead' | 'worker_departed'

export interface Alerte {
  id: number
  type: AlerteType
  label: string
  href: string
  detail: string
  severity: 'high' | 'medium' | 'low'
}

export interface AlertesIndexProps {
  alertes: Alerte[]
  counts: {
    intervention_overdue: number
    animal_dead: number
    worker_departed: number
  }
  issues: IssueItem[]
}
