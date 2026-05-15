import { render, screen } from '@testing-library/react'
import type { WeatherData } from '../../types/dashboard'
import { WeatherWidget } from './WeatherWidget'

const mockWeather: WeatherData = {
  temperature: 34,
  description: 'Ensoleillé',
  icon: '01d',
  forecast: [
    { day: 'Jeu', temp_max: 36, temp_min: 28, icon: '01d' },
    { day: 'Ven', temp_max: 29, temp_min: 24, icon: '10d' },
  ],
}

describe('WeatherWidget', () => {
  it('affiche la température et la description', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByText('34°C')).toBeInTheDocument()
    expect(screen.getByText('Ensoleillé')).toBeInTheDocument()
  })

  it('affiche le forecast', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByText('Jeu')).toBeInTheDocument()
    expect(screen.getByText('36°')).toBeInTheDocument()
  })

  it('affiche un message fallback quand weather est null', () => {
    render(<WeatherWidget weather={null} />)
    expect(screen.getByText('Météo indisponible')).toBeInTheDocument()
  })
})
