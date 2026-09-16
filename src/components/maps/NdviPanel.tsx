'use client';

import { useState, useMemo } from 'react';
import {
  Leaf,
  TrendingUp,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Satellite,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc';

interface NdviPanelProps {
  selectedParcel: {
    id: string;
    name: string;
    data: Record<string, unknown>;
  } | null;
  onClose: () => void;
}

function generateMockNdviData() {
  const months = [
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
    'Jan',
    'Fév',
  ];

  // Simulate seasonal NDVI: low in dry season, peak in rainy season (Jul-Oct)
  const baseValues = [
    0.18, 0.2, 0.25, 0.4, 0.62, 0.71, 0.68, 0.55, 0.35, 0.22, 0.17, 0.19,
  ];

  return months.map((month, i) => ({
    month,
    ndvi: Math.round((baseValues[i] + (Math.random() * 0.08 - 0.04)) * 100) / 100,
  }));
}

function getNdviColor(ndvi: number): string {
  if (ndvi < 0.2) return '#ef4444'; // red
  if (ndvi < 0.4) return '#f97316'; // orange
  if (ndvi < 0.6) return '#eab308'; // yellow
  return '#22c55e'; // green
}

function getNdviLabel(ndvi: number): string {
  if (ndvi < 0.2) return 'Sol nu / Stress sévère';
  if (ndvi < 0.4) return 'Végétation clairsemée';
  if (ndvi < 0.6) return 'Végétation modérée';
  return 'Végétation dense et saine';
}

/** Format an ISO date string to a short French month label */
function formatDateToMonth(dateStr: string): string {
  const monthLabels: Record<number, string> = {
    0: 'Jan',
    1: 'Fév',
    2: 'Mar',
    3: 'Avr',
    4: 'Mai',
    5: 'Jun',
    6: 'Jul',
    7: 'Aoû',
    8: 'Sep',
    9: 'Oct',
    10: 'Nov',
    11: 'Déc',
  };
  const d = new Date(dateStr);
  return monthLabels[d.getMonth()] ?? dateStr;
}

export function NdviPanel({ selectedParcel, onClose }: NdviPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Fetch real NDVI data from Sentinel Hub via tRPC
  const ndviQuery = trpc.ndvi.getTimeSeries.useQuery(
    { assetId: selectedParcel?.id ?? '', months: 12 },
    { enabled: !!selectedParcel?.id },
  );

  // Determine whether we use real or mock data
  const isLoading = ndviQuery.isLoading && !!selectedParcel;
  const realData = ndviQuery.data;
  const hasRealData =
    realData && realData.hasGeometry && realData.data.length > 0;

  const mockData = useMemo(() => generateMockNdviData(), [selectedParcel?.id]);

  // Build chart data: real data mapped to { month, ndvi } or mock fallback
  const ndviData = useMemo(() => {
    if (hasRealData) {
      return realData.data.map((point) => ({
        month: formatDateToMonth(point.date),
        ndvi: point.ndvi,
      }));
    }
    return mockData;
  }, [hasRealData, realData, mockData]);

  const currentNdvi = ndviData[ndviData.length - 1]?.ndvi ?? 0;

  if (!selectedParcel) return null;

  return (
    <div
      className={`absolute right-0 top-0 z-20 flex h-full transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-[320px]'
      }`}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-20 flex h-10 w-6 items-center justify-center rounded-l-md bg-white shadow-md"
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Panel */}
      <div className="h-full w-[320px] overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Indice NDVI</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fermer
            </button>
          </div>
          <p className="mt-1 text-sm font-medium text-green-700">
            {selectedParcel.name}
          </p>
        </div>

        {/* Parcel metadata */}
        <div className="border-b border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Surface</span>
              <p className="font-medium text-gray-800">
                {(selectedParcel.data.surface_ha as number) ?? '-'} ha
              </p>
            </div>
            <div>
              <span className="text-gray-500">Type de sol</span>
              <p className="font-medium text-gray-800">
                {(selectedParcel.data.soil_type as string) ?? '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 border-b border-gray-100 p-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Chargement des données satellite...</span>
          </div>
        )}

        {/* Current NDVI score */}
        {!isLoading && (
          <>
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Dernier indice NDVI</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                  style={{ backgroundColor: getNdviColor(currentNdvi) }}
                >
                  {currentNdvi.toFixed(2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {getNdviLabel(currentNdvi)}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Tendance sur 12 mois</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NDVI Chart */}
            <div className="p-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                Evolution NDVI (12 mois)
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ndviData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      formatter={(value) => [Number(value).toFixed(2), 'NDVI']}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <defs>
                      <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="ndvi"
                      stroke="#16a34a"
                      strokeWidth={2}
                      fill="url(#ndviGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Data source indicator */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Satellite className="h-3 w-3" />
                <span>
                  {hasRealData
                    ? 'Données Sentinel-2 (Copernicus)'
                    : 'Données simulées'}
                </span>
              </div>
            </div>

            {/* NDVI Legend */}
            <div className="border-t border-gray-100 p-4">
              <h4 className="mb-2 text-xs font-medium text-gray-500">
                Echelle NDVI
              </h4>
              <div className="space-y-1.5 text-xs">
                {[
                  { min: 0, max: 0.2, color: '#ef4444', label: 'Sol nu / Stress sévère' },
                  { min: 0.2, max: 0.4, color: '#f97316', label: 'Végétation clairsemée' },
                  { min: 0.4, max: 0.6, color: '#eab308', label: 'Végétation modérée' },
                  { min: 0.6, max: 1.0, color: '#22c55e', label: 'Végétation dense' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">
                      {item.min} - {item.max}: {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
