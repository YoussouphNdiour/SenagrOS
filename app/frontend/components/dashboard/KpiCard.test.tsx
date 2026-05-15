import { render, screen } from '@testing-library/react'
import { Leaf } from 'lucide-react'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('affiche le titre et la valeur', () => {
    render(<KpiCard title="Surfaces" value={12.5} unit="ha" icon={<Leaf size={20} />} />)
    expect(screen.getByText('Surfaces')).toBeInTheDocument()
    expect(screen.getByText('12.5')).toBeInTheDocument()
    expect(screen.getByText('ha')).toBeInTheDocument()
  })

  it('affiche — quand la valeur est null', () => {
    render(<KpiCard title="Dépenses" value={null} unit="FCFA" icon={<Leaf size={20} />} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it("n'affiche pas d'unité quand la valeur est null", () => {
    render(<KpiCard title="Dépenses" value={null} unit="FCFA" icon={<Leaf size={20} />} />)
    expect(screen.queryByText('FCFA')).not.toBeInTheDocument()
  })
})
