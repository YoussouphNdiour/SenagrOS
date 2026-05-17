import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import InterventionShow from './Show'

vi.mock('@inertiajs/react', () => ({ usePage: vi.fn() }))

import { usePage } from '@inertiajs/react'

const sharedProps = {
  appShell: { campaign: { name: 'Hivernage 2024' }, user: { name: 'Yoûssouph N.', initials: 'YN' } },
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: sharedProps,
    url: '/backend/interventions/1',
  } as unknown as ReturnType<typeof usePage>)
})

const mockIntervention = {
  id: 1,
  number: 'INT-2024-001',
  procedure_name: 'Semis céréales',
  state: 'done',
  nature: 'record',
  started_at: '2024-07-15T08:00:00Z',
  stopped_at: '2024-07-15T12:00:00Z',
  description: 'Semis de mil sur parcelle nord',
  working_duration: 14400,
  whole_duration: 14400,
  request_compliant: true,
}

describe('InterventionShow', () => {
  it('renders intervention number and procedure name', () => {
    render(
      <InterventionShow
        intervention={mockIntervention}
        targets={[]}
        inputs={[]}
        doers={[]}
        tools={[]}
      />
    )
    expect(screen.getByText('INT-2024-001')).toBeInTheDocument()
    expect(screen.getByText('Semis céréales')).toBeInTheDocument()
  })

  it('shows done state badge', () => {
    render(
      <InterventionShow
        intervention={mockIntervention}
        targets={[]}
        inputs={[]}
        doers={[]}
        tools={[]}
      />
    )
    expect(screen.getByText('Terminée')).toBeInTheDocument()
  })

  it('shows description', () => {
    render(
      <InterventionShow
        intervention={mockIntervention}
        targets={[]}
        inputs={[]}
        doers={[]}
        tools={[]}
      />
    )
    expect(screen.getByText('Semis de mil sur parcelle nord')).toBeInTheDocument()
  })

  it('shows targets section when targets present', () => {
    const targets = [{ id: 1, product_name: 'Parcelle Nord' }]
    render(
      <InterventionShow
        intervention={mockIntervention}
        targets={targets}
        inputs={[]}
        doers={[]}
        tools={[]}
      />
    )
    expect(screen.getByText('Parcelle Nord')).toBeInTheDocument()
  })

  it('formats working duration', () => {
    render(
      <InterventionShow
        intervention={mockIntervention}
        targets={[]}
        inputs={[]}
        doers={[]}
        tools={[]}
      />
    )
    const durations = screen.getAllByText('4h')
    expect(durations.length).toBeGreaterThanOrEqual(1)
  })
})
