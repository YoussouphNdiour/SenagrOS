import { render, screen, fireEvent } from '@testing-library/react'
import { InterventionKanban } from './InterventionKanban'

describe('InterventionKanban', () => {
  const counts = { planned: 5, in_progress: 2, done: 12, validated: 8 }

  it('affiche les 4 colonnes', () => {
    render(<InterventionKanban counts={counts} onFilter={() => {}} />)
    expect(screen.getByText(/planifié/i)).toBeInTheDocument()
    expect(screen.getByText(/en cours/i)).toBeInTheDocument()
    expect(screen.getByText(/terminé/i)).toBeInTheDocument()
    expect(screen.getByText(/validé/i)).toBeInTheDocument()
  })

  it('affiche le count "5" pour Planifié', () => {
    render(<InterventionKanban counts={counts} onFilter={() => {}} />)
    expect(screen.getByTestId('count-planned')).toHaveTextContent('5')
  })

  it('affiche le count "2" pour En cours', () => {
    render(<InterventionKanban counts={counts} onFilter={() => {}} />)
    expect(screen.getByTestId('count-in_progress')).toHaveTextContent('2')
  })

  it('affiche le count "0" sans erreur', () => {
    render(
      <InterventionKanban
        counts={{ planned: 0, in_progress: 0, done: 0, validated: 0 }}
        onFilter={() => {}}
      />
    )
    expect(screen.getAllByText('0')).toHaveLength(4)
  })

  it('appelle onFilter avec le bon filtre au clic sur "Voir" Planifié', () => {
    const onFilter = vi.fn()
    render(<InterventionKanban counts={counts} onFilter={onFilter} />)
    fireEvent.click(screen.getByTestId('voir-planned'))
    expect(onFilter).toHaveBeenCalledWith({ nature: ['request'], state: undefined, page: 1 })
  })

  it('appelle onFilter avec state "in_progress" au clic sur "Voir" En cours', () => {
    const onFilter = vi.fn()
    render(<InterventionKanban counts={counts} onFilter={onFilter} />)
    fireEvent.click(screen.getByTestId('voir-in_progress'))
    expect(onFilter).toHaveBeenCalledWith({ nature: ['record'], state: ['in_progress'], page: 1 })
  })
})
