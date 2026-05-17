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
