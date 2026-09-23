'use client';

import { useState, useMemo } from 'react';
import { Leaf, TrendingUp, Calendar, Loader2, Satellite } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc';

interface NdviWidgetProps {
  assetId: string;
  parcelName: string;
}

function generateMockNdviData() {
  const months = ['Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'];
  const base = [0.18, 0.2, 0.25, 0.4, 0.62, 0.71, 0.68, 0.55, 0.35, 0.22, 0.17, 0.19];
  return months.map((month, i) => ({
    month,
    ndvi: Math.round((base[i] + (Math.random() * 0.08 - 0.04)) * 100) / 100,
  }));
}

function getNdviColor(v: number) {
  if (v < 0.2) return '#ef4444';
  if (v < 0.4) return '#f97316';
  if (v < 0.6) return '#eab308';
  return '#22c55e';
}

function getNdviLabel(v: number) {
  if (v < 0.2) return 'Sol nu / Stress sévère';
  if (v < 0.4) return 'Végétation clairsemée';
  if (v < 0.6) return 'Végétation modérée';
  return 'Végétation dense et saine';
}

function fmtMonth(dateStr: string) {
  const months: Record<number, string> = { 0:'Jan',1:'Fév',2:'Mar',3:'Avr',4:'Mai',5:'Jun',6:'Jul',7:'Aoû',8:'Sep',9:'Oct',10:'Nov',11:'Déc' };
  return months[new Date(dateStr).getMonth()] ?? dateStr;
}

export function NdviWidget({ assetId, parcelName }: NdviWidgetProps) {
  const [months, setMonths] = useState<3 | 6 | 12 | 24>(12);

  const { data: ndviData, isLoading } = trpc.ndvi.getTimeSeries.useQuery(
    { assetId, months },
    { enabled: !!assetId },
  );

  const hasReal = ndviData?.hasGeometry && (ndviData.data.length ?? 0) > 0;

  const mockData = useMemo(() => generateMockNdviData(), [assetId]);

  const chartData = useMemo(() => {
    if (hasReal) return (ndviData?.data ?? []).map((p) => ({ month: fmtMonth(p.date), ndvi: p.ndvi }));
    return mockData;
  }, [hasReal, ndviData, mockData]);

  const current = chartData[chartData.length - 1]?.ndvi ?? 0;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-700">{parcelName}</span>
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement données satellite...
        </div>
      ) : (
        <>
          {/* Score */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow"
              style={{ backgroundColor: getNdviColor(current) }}
            >
              {current.toFixed(2)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{getNdviLabel(current)}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Tendance sur {months} mois</span>
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
                <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} width={30} />
                <Tooltip
                  formatter={(v) => [Number(v).toFixed(2), 'NDVI']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <defs>
                  <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="ndvi" stroke="#16a34a" strokeWidth={2} fill="url(#ndviGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[
              { range: '0 – 0.2', color: '#ef4444', label: 'Sol nu / Stress sévère' },
              { range: '0.2 – 0.4', color: '#f97316', label: 'Végétation clairsemée' },
              { range: '0.4 – 0.6', color: '#eab308', label: 'Végétation modérée' },
              { range: '0.6 – 1.0', color: '#22c55e', label: 'Végétation dense' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-gray-500">{item.range} — {item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
