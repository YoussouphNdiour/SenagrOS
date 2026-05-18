export interface JournalEntryItem {
  id: number
  name: string
  account_number: string
  real_debit: number
  real_credit: number
}

export interface JournalEntry {
  id: number
  number: string
  printed_on: string
  state: string
  real_debit: number
  real_credit: number
  journal_name: string
  items: JournalEntryItem[]
}

export interface ComptabiliteIndexProps {
  entries: JournalEntry[]
  meta: { total: number; page: number; per_page: number }
}

export interface JournalEntryItemDetail {
  id: number
  position: number
  name: string
  account_number: string
  account_name: string
  real_debit: number
  real_credit: number
  letter: string
}

export interface JournalEntryShowProps {
  entry: {
    id: number
    number: string
    name: string
    state: string
    printed_on: string | null
    real_debit: number
    real_credit: number
    real_currency: string
    real_currency_rate: number
    reference_number: string
    continuous_number: string
    validated_at: string | null
    journal_name: string
    financial_year_name: string
  }
  items: JournalEntryItemDetail[]
}

export interface JournalEntryFormItem {
  id: number | null
  name: string
  account_number: string
  real_debit: number
  real_credit: number
}

export interface JournalEntryFormData {
  id: number
  journal_id: number | null
  printed_on: string | null
  reference_number: string
  items: JournalEntryFormItem[]
}

export interface ComptabiliteFormProps {
  entry: JournalEntryFormData | null
  journals: Array<{ id: number; name: string }>
  errors: Record<string, string>
}
