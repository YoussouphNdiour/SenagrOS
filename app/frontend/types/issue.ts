export interface IssueItem {
  id: number
  name: string
  nature: string
  gravity: number
  observed_at: string | null
  state: string
}

export interface IssueShowItem {
  id: number
  name: string
  nature: string
  gravity: number
  observed_at: string | null
  state: 'opened' | 'closed' | 'aborted'
  description: string | null
  target_type: string | null
  target_id: number | null
}

export interface IssueShowProps {
  issue: IssueShowItem
}

export interface IssueFormItem {
  id?: number
  name: string
  nature: string
  gravity: number
  observed_at: string
  description: string | null
  state?: string
}

export interface IssueFormErrors {
  name?: string
  nature?: string
  gravity?: string
  observed_at?: string
}

export interface IssueFormProps {
  issue: IssueFormItem | null
  errors: IssueFormErrors
}

export const ISSUE_NATURE_LABELS: Record<string, string> = {
  accident:                         'Accident',
  climate_issue:                    'Incident climatique',
  disease:                          'Maladie',
  drought:                          'Sécheresse',
  escape:                           'Fuite d\'animaux',
  equipment_crash:                  'Accident matériel',
  empty_fuel_tank:                  'Panne sèche',
  aphid:                            'Puceron',
  caterpillar:                      'Chenilles',
  cotton_bollworm:                  'Noctuelle défoliatrice',
  bacteria_disease:                 'Bactériose',
  bacterial_disease:                'Maladie bactérienne',
  bad_vegetative_growth_conditions: 'Mauvais état végétatif',
  diarrhea:                         'Diarrhée',
  cough:                            'Toux',
}

export const ISSUE_STATE_LABELS: Record<string, string> = {
  opened:  'Ouvert',
  closed:  'Fermé',
  aborted: 'Abandonné',
}
