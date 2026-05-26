import { Sun, Cloud, CloudRain, Wind } from 'lucide-react'
import type { WeatherData } from '../../types/dashboard'

/** Map OpenWeatherMap icon codes to Lucide icons */
function WeatherIcon({ code, size }: { code: string; size: number }) {
  if (code.startsWith('01')) return <Sun size={size} />
  if (code.startsWith('09') || code.startsWith('10')) return <CloudRain size={size} />
  if (code.startsWith('50')) return <Wind size={size} />
  return <Cloud size={size} />
}

interface WeatherWidgetProps {
  weather: WeatherData | null
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '18px 20px',
        color: 'var(--color-text-muted)',
        fontSize: '14px',
      }}>
        Météo indisponible
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-card)',
      padding: '18px 20px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Sun glow background */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #FCD34D 0%, transparent 70%)',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Météo
          </span>
          {/* EN DIRECT pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#f0f7ec',
            color: '#1B6B3A',
            border: '1px solid #c3dfb3',
            borderRadius: '999px',
            padding: '1px 8px',
            fontSize: '10px',
            fontWeight: 700,
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6B3A' }} />
            EN DIRECT
          </span>
        </div>

        {/* Current temperature */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #FCD34D 0%, #E8A020 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(232, 160, 32, 0.35)',
            flexShrink: 0,
          }}>
            <WeatherIcon code={weather.icon} size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{
                fontSize: '38px',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1,
                fontFamily: 'var(--font-heading)',
              }}>
                {weather.temperature}
              </span>
              <span style={{ fontSize: '18px', color: 'var(--color-text-muted)', fontWeight: 500 }}>°C</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {weather.description}
            </div>
          </div>
        </div>

        {/* 5-day forecast */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {weather.forecast.map((day) => (
            <div key={day.day} style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--color-bg)',
              borderRadius: '8px',
              padding: '8px 4px',
            }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {day.day}
              </div>
              <div style={{ margin: '4px 0', color: '#E8A020', display: 'flex', justifyContent: 'center' }}>
                <WeatherIcon code={day.icon} size={18} />
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--color-text)',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {day.temp_max}°
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {day.temp_min}°
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
