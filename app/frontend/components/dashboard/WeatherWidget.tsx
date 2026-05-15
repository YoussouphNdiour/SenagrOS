import type { WeatherData } from '../../types/dashboard'

interface WeatherWidgetProps {
  weather: WeatherData | null
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
        }}
      >
        Météo indisponible
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          width={48}
          height={48}
        />
        <div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
            {weather.temperature}°C
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {weather.description}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {weather.forecast.map((day) => (
          <div
            key={day.day}
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--color-bg)',
              borderRadius: '6px',
              padding: '6px 4px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{day.day}</div>
            <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.day} width={24} height={24} />
            <div style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{day.temp_max}°</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{day.temp_min}°</div>
          </div>
        ))}
      </div>
    </div>
  )
}
