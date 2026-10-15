'use client';

import { useState, useMemo } from 'react';
import { CloudRain, Loader2, Droplet, CalendarClock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { trpc } from '@/lib/trpc';

interface RainfallWidgetProps {
  assetId: string;
}

const RANGES = [30, 90, 180] as const;
type Range = (typeof RANGES)[number];

/**
 * Cumul glissant sur 3 jours a partir duquel un semis est generalement
 * envisage au Sahel. Repere indicatif, a calibrer par culture et par zone
 * avec un agronome : il n'est pas issu d'un referentiel officiel.
 */
const SOWING_RAIN_MM = 20;
const SOWING_WINDOW_DAYS = 3;

function fmtDay(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function RainfallWidget({ assetId }: RainfallWidgetProps) {
  const [days, setDays] = useState<Range>(90);

  const { data, isLoading } = trpc.weather.getRainfall.useQuery(
    { assetId, days },
    { enabled: !!assetId },
  );

  const chartData = useMemo(() => {
    const history = data?.history ?? [];
    const forecast = data?.forecast ?? [];
    // Open-Meteo peut rendre le jour courant des deux cotes : les previsions
    // font foi pour les dates qu'elles couvrent.
    const forecastDates = new Set(forecast.map((f) => f.date));
    return [
      ...history.filter((h) => !forecastDates.has(h.date)),
      ...forecast,
    ].map((d) => ({ ...d, label: fmtDay(d.date) }));
  }, [data]);

  const stats = useMemo(() => {
    const history = data?.history ?? [];
    if (history.length === 0) return null;
    const total = history.reduce((sum, d) => sum + d.mm, 0);
    const rainyDays = history.filter((d) => d.mm >= 1).length;

    // Dernier cumul glissant atteignant le repere de semis.
    let lastWindow: { date: string; mm: number } | null = null;
    for (let i = history.length - 1; i >= SOWING_WINDOW_DAYS - 1; i--) {
      const window = history.slice(i - SOWING_WINDOW_DAYS + 1, i + 1);
      const sum = window.reduce((s, d) => s + d.mm, 0);
      if (sum >= SOWING_RAIN_MM) {
        lastWindow = { date: history[i].date, mm: Math.round(sum * 10) / 10 };
        break;
      }
    }

    const sinceLastRain = (() => {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].mm >= 1) return history.length - 1 - i;
      }
      return null;
    })();

    return {
      total: Math.round(total * 10) / 10,
      rainyDays,
      lastWindow,
      sinceLastRain,
    };
  }, [data]);

  const forecastTotal = useMemo(
    () => Math.round((data?.forecast ?? []).reduce((s, d) => s + d.mm, 0) * 10) / 10,
    [data],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-sky-600" />
          <span className="font-medium text-gray-700">Pluviométrie</span>
          {data?.origin === 'farm' && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
              position de la ferme
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                days === d ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}J
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement pluviométrie...
        </div>
      ) : chartData.length === 0 || !stats ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
          <CloudRain className="mx-auto mb-2 h-5 w-5 text-gray-300" />
          Aucune donnée de pluie disponible.
          <div className="mt-1 text-xs text-gray-400">
            Parcelle sans géométrie et ferme sans coordonnées renseignées.
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={`Cumul ${days} j`} value={`${stats.total} mm`} />
            <Stat label="Jours de pluie" value={`${stats.rainyDays}`} />
            <Stat
              label="Sans pluie depuis"
              value={stats.sinceLastRain === null ? '—' : `${stats.sinceLastRain} j`}
              warn={stats.sinceLastRain !== null && stats.sinceLastRain >= 10}
            />
            <Stat label="Prévu 7 j" value={`${forecastTotal} mm`} />
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  width={34}
                  label={{ value: 'mm', angle: 0, position: 'top', fontSize: 10, fill: '#9ca3af' }}
                />
                <Tooltip
                  formatter={(v, _n, item) => [
                    `${Number(v).toFixed(1)} mm`,
                    item?.payload?.forecast ? 'Prévision' : 'Mesuré',
                  ]}
                  labelFormatter={(l) => `Le ${l}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <ReferenceLine y={SOWING_RAIN_MM} stroke="#f59e0b" strokeDasharray="4 3" />
                <Bar dataKey="mm" radius={[2, 2, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={d.forecast ? '#bae6fd' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" /> Mesuré (ERA5)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-200" /> Prévision
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-3 border-t-2 border-dashed border-amber-500" />
              Repère semis ({SOWING_RAIN_MM} mm)
            </span>
          </div>

          {stats.lastWindow ? (
            <p className="flex items-start gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
              <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Dernier cumul de {SOWING_RAIN_MM} mm sur {SOWING_WINDOW_DAYS} jours atteint le{' '}
                <strong>{fmtDay(stats.lastWindow.date)}</strong> ({stats.lastWindow.mm} mm). Repère
                indicatif, à calibrer avec un agronome.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <Droplet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Aucun cumul de {SOWING_RAIN_MM} mm sur {SOWING_WINDOW_DAYS} jours sur la période.
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${warn ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}
