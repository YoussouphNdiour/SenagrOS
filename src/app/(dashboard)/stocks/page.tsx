'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { Package, AlertTriangle, Warehouse, TrendingUp } from 'lucide-react';

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

const categoryLabels: Record<string, string> = {
  phyto: 'Phytosanitaire',
  ferti: 'Fertilisation',
  semence: 'Semences',
};

const unitLabels: Record<string, string> = {
  kg: 'kg',
  L: 'L',
  g: 'g',
  mL: 'mL',
  sac: 'Sac',
  unite: 'Unité',
};

export default function StocksPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');

  const { data: kpis, isLoading: kpisLoading } = trpc.inventory.kpis.useQuery();
  const { data: stockList, isLoading: listLoading } = trpc.inventory.list.useQuery({
    search: search || undefined,
    category: (category as 'phyto' | 'ferti' | 'semence') || undefined,
    page: 1,
    limit: 50,
  });
  const { data: alerts } = trpc.inventory.alerts.useQuery({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stocks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Suivi des stocks d&apos;intrants et alertes de seuil
        </p>
      </div>

      {/* KPIs */}
      {kpisLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Articles en stock"
            value={`${kpis.totalArticles}`}
            icon={Package}
            color="blue"
          />
          <KpiCard
            title="Valorisation totale"
            value={`${formatFCFA(kpis.valorisationTotal)} FCFA`}
            icon={TrendingUp}
            color="green"
          />
          <KpiCard
            title="Alertes seuil"
            value={`${kpis.alertCount}`}
            icon={AlertTriangle}
            color={kpis.alertCount > 0 ? 'red' : 'green'}
          />
          <KpiCard
            title="Catégories"
            value={`${kpis.phytoCount} / ${kpis.fertiCount} / ${kpis.semenceCount}`}
            icon={Warehouse}
            color="orange"
          />
        </div>
      ) : null}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Alertes de stock bas ({alerts.length})
          </h3>
          <ul className="space-y-1 text-sm text-red-600">
            {alerts.map((a) => (
              <li key={a.asset.id}>
                <span className="font-medium">{a.asset.name}</span> — {a.current} / {a.threshold}{' '}
                {unitLabels[a.stockUnit] ?? a.stockUnit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Toutes catégories</option>
          <option value="phyto">Phytosanitaire</option>
          <option value="ferti">Fertilisation</option>
          <option value="semence">Semences</option>
        </select>
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Article</th>
              <th className="px-4 py-3 font-medium text-gray-600">Catégorie</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Stock actuel</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Seuil</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Prix unit.</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Valorisation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : stockList && stockList.items.length > 0 ? (
              stockList.items.map((item) => {
                const data = item.data as Record<string, unknown> | null;
                const cat = (data?.input_category as string) ?? (item.type === 'seed' ? 'semence' : '');
                const isLow = item.stockThreshold > 0 && item.currentStock < item.stockThreshold;
                return (
                  <tr key={item.id} className={isLow ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {categoryLabels[cat] ?? cat}
                    </td>
                    <td className={`px-4 py-3 text-right ${isLow ? 'font-semibold text-red-600' : 'text-gray-700'}`}>
                      {item.currentStock} {unitLabels[item.stockUnit] ?? item.stockUnit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {item.stockThreshold > 0
                        ? `${item.stockThreshold} ${unitLabels[item.stockUnit] ?? item.stockUnit}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {item.unitPriceXof > 0 ? `${formatFCFA(item.unitPriceXof)} FCFA` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {item.valorisation > 0 ? `${formatFCFA(item.valorisation)} FCFA` : '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun article en stock
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {stockList && (
        <p className="text-right text-xs text-gray-400">
          {stockList.total} article{stockList.total > 1 ? 's' : ''} au total
        </p>
      )}
    </div>
  );
}
