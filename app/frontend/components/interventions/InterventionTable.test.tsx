import { render, screen, fireEvent } from '@testing-library/react'
import { InterventionTable } from './InterventionTable'
import type { Intervention } from '../../types/intervention'

const makeRow = (overrides: Partial<Intervention> = {}): Intervention => ({
  id: 1,
  procedure_name: 'sowing',
  nature: 'record',
  state: 'done',
  started_at: '2026-01-15T08:00:00Z',
  stopped_at: '2026-01-15T12:00:00Z',
  name: 'Semis blé',
  human_activities_names: 'Céréales',
  human_target_names: 'Parcelle A',
  human_working_duration: '4h',
  human_working_zone_area: '2,50 ha',
  ...overrides,
})

describe('InterventionTable', () => {
  const meta = { total: 1, page: 1, per_page: 25 }

  it('affiche le nom de l\'intervention', () => {
    render(<InterventionTable rows={[makeRow()]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('Semis blé')).toBeInTheDocument()
  })

  it('affiche les activités', () => {
    render(<InterventionTable rows={[makeRow()]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('Céréales')).toBeInTheDocument()
  })

  it('affiche un badge pour l\'état "done"', () => {
    render(<InterventionTable rows={[makeRow({ state: 'done' })]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('Terminé')).toBeInTheDocument()
  })

  it('affiche un badge pour l\'état "in_progress"', () => {
    render(<InterventionTable rows={[makeRow({ state: 'in_progress' })]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('affiche la date de début formatée', () => {
    render(<InterventionTable rows={[makeRow()]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('15/01/2026')).toBeInTheDocument()
  })

  it('affiche "Aucune intervention" si le tableau est vide', () => {
    render(
      <InterventionTable rows={[]} meta={{ total: 0, page: 1, per_page: 25 }} onPage={vi.fn()} />
    )
    expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
  })

  it('désactive le bouton Précédent à la première page', () => {
    render(<InterventionTable rows={[makeRow()]} meta={{ total: 50, page: 1, per_page: 25 }} onPage={vi.fn()} />)
    expect(screen.getByText(/précédent/i)).toBeDisabled()
  })

  it('appelle onPage avec page+1 au clic sur Suivant', () => {
    const onPage = vi.fn()
    render(
      <InterventionTable
        rows={[makeRow()]}
        meta={{ total: 50, page: 1, per_page: 25 }}
        onPage={onPage}
      />
    )
    fireEvent.click(screen.getByText(/suivant/i))
    expect(onPage).toHaveBeenCalledWith({ page: 2 })
  })

  it('désactive le bouton Suivant à la dernière page', () => {
    render(
      <InterventionTable rows={[makeRow()]} meta={{ total: 25, page: 1, per_page: 25 }} onPage={vi.fn()} />
    )
    expect(screen.getByText(/suivant/i)).toBeDisabled()
  })
})
