'use client';

import { useState, useMemo } from 'react';
import { Leaf, TrendingUp, Loader2, Satellite, Droplets } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import type { SpectralIndex } from '@/lib/sentinel-hub';

interface NdviWidgetProps {
  assetId: string;
  parcelName: string;
}

interface Band {
  min: number;
  color: string;
  label: string;
}

interface IndexUi {
  label: string;
  description: string;
  domain: [number, number];
  stroke: string;
  gradient: string;
  /** Du seuil le plus haut au plus bas : le premier `min` atteint gagne. */
  bands: Band[];
}

const INDEX_UI: Record<SpectralIndex, IndexUi> = {
  ndvi: {
    label: 'NDVI',
    description: 'Vigueur de la végétation',
    domain: [0, 1],
    stroke: '#16a34a',
    gradient: '#22c55e',
    bands: [
      { min: 0.6, color: '#22c55e', label: 'Végétation dense' },
      { min: 0.4, color: '#eab308', label: 'Végétation modérée' },
      { min: 0.2, color: '#f97316', label: 'Végétation clairsemée' },
      { min: Number.NEGATIVE_INFINITY, color: '#ef4444', label: 'Sol nu / Stress sévère' },
    ],
  },
  ndmi: {
    label: 'NDMI',
    description: "Teneur en eau de la végétation",
    domain: [-1, 1],
    stroke: '#0284c7',
    gradient: '#38bdf8',
    bands: [
      { min: 0.4, color: '#0284c7', label: 'Forte teneur en eau' },
      { min: 0.2, color: '#38bdf8', label: 'Teneur satisfaisante' },
      { min: 0, color: '#f97316', label: 'Stress hydrique modéré' },
      { min: Number.NEGATIVE_INFINITY, color: '#ef4444', label: 'Stress hydrique sévère' },
    ],
  },
};

function resolveBand(index: SpectralIndex, value: number): Band {
  const { bands } = INDEX_UI[index];
  return bands.find((b) => value >= b.min) ?? bands[bands.length - 1];
}

// Repli simule, uniquement pour le NDVI : ses valeurs saisonnieres sont
// calibrees sur l'hivernage senegalais. Aucun equivalent n'est invente pour le
// NDMI — sans donnee reelle, le widget affiche un etat vide explicite.
function generateMockNdviData() {
  const months = ['Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'];
  const base = [0.18, 0.2, 0.25, 0.4, 0.62, 0.71, 0.68, 0.55, 0.35, 0.22, 0.17, 0.19];
  return months.map((month, i) => ({
    month,
    value: Math.round((base[i] + (Math.random() * 0.08 - 0.04)) * 100) / 100,
  }));
}

function fmtMonth(dateStr: string) {
  const months: Record<number, string> = { 0:'Jan',1:'Fév',2:'Mar',3:'Avr',4:'Mai',5:'Jun',6:'Jul',7:'Aoû',8:'Sep',9:'Oct',10:'Nov',11:'Déc' };
  return months[new Date(dateStr).getMonth()] ?? dateStr;
}

export function NdviWidget({ assetId, parcelName }: NdviWidgetProps) {
  const [months, setMonths] = useState<3 | 6 | 12 | 24>(12);
  const [index, setIndex] = useState<SpectralIndex>('ndvi');

  const { data: indexData, isLoading } = trpc.ndvi.getTimeSeries.useQuery(
    { assetId, months, index },
    { enabled: !!assetId },
  );

  const ui = INDEX_UI[index];
  const hasReal = indexData?.hasGeometry && (indexData.data.length ?? 0) > 0;

  // Invalidation volontaire : regenere la courbe simulee quand la parcelle
  // change. generateMockNdviData() ne lit pas assetId, d'ou le signalement.
  // biome-ignore lint/correctness/useExhaustiveDependencies: invalidation volontaire par parcelle
  const mockData = useMemo(() => generateMockNdviData(), [assetId]);

  const chartData = useMemo(() => {
    if (hasReal) return (indexData?.data ?? []).map((p) => ({ month: fmtMonth(p.date), value: p.value }));
    return index === 'ndvi' ? mockData : [];
  }, [hasReal, indexData, mockData, index]);

  const current = chartData[chartData.length - 1]?.value;
  const band = current === undefined ? null : resolveBand(index, current);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-700">{parcelName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(Object.keys(INDEX_UI) as SpectralIndex[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIndex(key)}
                title={INDEX_UI[key].description}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition ${
                  index === key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {key === 'ndmi' && <Droplets className="h-3 w-3" />}
                {INDEX_UI[key].label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {([3, 6, 12, 24] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                  months === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement données satellite...
        </div>
      ) : chartData.length === 0 || !band || current === undefined ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
          <Satellite className="mx-auto mb-2 h-5 w-5 text-gray-300" />
          Aucune mesure {ui.label} exploitable sur {months} mois.
          <div className="mt-1 text-xs text-gray-400">
            Couverture nuageuse persistante ou parcelle sans géométrie tracée.
          </div>
        </div>
      ) : (
        <>
          {/* Score */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow"
              style={{ backgroundColor: band.color }}
            >
              {current.toFixed(2)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{band.label}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{ui.description} — {months} mois</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                <Satellite className="h-3 w-3" />
                <span>{hasReal ? 'Sentinel-2 (Copernicus)' : 'Données simulées'}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                <YAxis domain={ui.domain} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} width={34} />
                <Tooltip
                  formatter={(v) => [Number(v).toFixed(2), ui.label]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <defs>
                  <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ui.gradient} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={ui.gradient} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={ui.stroke} strokeWidth={2} fill={`url(#grad-${index})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            {ui.bands.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: b.color }} />
                <span className="text-gray-500">
                  {b.min === Number.NEGATIVE_INFINITY ? `< ${ui.bands[ui.bands.length - 2].min}` : `≥ ${b.min}`} — {b.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
