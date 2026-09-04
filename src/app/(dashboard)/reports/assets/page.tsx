'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { AssetDistributionChart } from '@/components/charts/AssetDistributionChart';
import { ExportBar } from '@/components/charts/ExportBar';
import { Landmark, Sprout, Rabbit, Wrench } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  land: 'Parcelles',
  plant: 'Cultures',
  animal: 'Animaux',
  equipment: 'Équipements',
  structure: 'Structures',
  material: 'Intrants',
  sensor: 'Capteurs',
  water: 'Eau',
  seed: 'Semences',
  product: 'Produits',
  compost: 'Compost',
  group: 'Groupes',
};

export default function AssetsReportPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = trpc.report.assets.useQuery({
    type: typeFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Rapport Patrimoine</h1>
        <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  const exportData = data.items.map((item) => ({
    Nom: item.name,
    Type: TYPE_LABELS[item.type] ?? item.type,
    Statut: item.status,
    'Date création': item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '',
  }));

  const landCount = data.byType.find((t) => t.type === 'land')?.count ?? 0;
  const plantCount = data.byType.find((t) => t.type === 'plant')?.count ?? 0;
  const animalCount = data.byType.find((t) => t.type === 'animal')?.count ?? 0;
  const equipCount = data.byType.find((t) => t.type === 'equipment')?.count ?? 0;

  return (
    <div id="report-assets" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapport Patrimoine</h1>
          <p className="mt-1 text-sm text-gray-500">Répartition par type d&apos;actif</p>
        </div>
        <ExportBar data={exportData} filename="rapport-patrimoine" pdfElementId="report-assets" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Au</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total actifs" value={data.total} icon={Landmark} color="green" />
        <KpiCard title="Cultures" value={plantCount} icon={Sprout} color="blue" />
        <KpiCard title="Animaux" value={animalCount} icon={Rabbit} color="orange" />
        <KpiCard title="Équipements" value={equipCount} icon={Wrench} color="purple" />
      </div>

      {/* Chart */}
      <AssetDistributionChart data={data.byType} />

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[item.type] ?? item.type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Aucun actif trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
