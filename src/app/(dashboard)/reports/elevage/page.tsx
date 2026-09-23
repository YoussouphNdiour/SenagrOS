'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import {
  HeartPulse,
  TrendingDown,
  Coins,
  Baby,
  Users,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export default function ElevageTdbPage() {
  const thisYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${thisYear}-01-01`);
  const [dateTo, setDateTo] = useState(`${thisYear}-12-31`);

  const { data, isLoading } = trpc.report.livestockKpis.useQuery({
    dateFrom,
    dateTo,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TDB Technique Élevage</h1>
          <p className="text-sm text-gray-500">
            Indicateurs de performance du cheptel
          </p>
        </div>
      </div>

      {/* Period filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Période du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </Card>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Effectif actif"
              value={`${fmt(data.effectifActif)} têtes`}
              icon={Users}
              color="green"
            />
            <KpiCard
              title="Taux de mortalité"
              value={`${data.tauxMortalite} %`}
              icon={TrendingDown}
              color={data.tauxMortalite > 10 ? 'red' : data.tauxMortalite > 5 ? 'orange' : 'green'}
            />
            <KpiCard
              title="Coût alim. / tête"
              value={`${fmt(data.coutAlimentaireParTete)} FCFA`}
              icon={Coins}
              color="blue"
            />
            <KpiCard
              title="Taux mise bas / ponte"
              value={`${data.tauxMiseBas} %`}
              icon={Baby}
              color="purple"
            />
          </div>

          {/* Detail table */}
          <Card>
            <h2 className="mb-4 text-base font-semibold text-gray-700">
              Détail de la période ({data.periode.from} → {data.periode.to})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <tr className="py-2">
                    <td className="py-2 text-gray-500">Effectif total (tous statuts)</td>
                    <td className="py-2 text-right font-medium text-gray-800">{fmt(data.effectifTotal)} têtes</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Effectif actif</td>
                    <td className="py-2 text-right font-medium text-gray-800">{fmt(data.effectifActif)} têtes</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Décès sur la période</td>
                    <td className="py-2 text-right font-medium text-red-600">{fmt(data.decedésPeriode)} têtes</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Naissances sur la période</td>
                    <td className="py-2 text-right font-medium text-green-600">{fmt(data.naissancesPeriode)} nés</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Coût alimentaire total</td>
                    <td className="py-2 text-right font-medium text-gray-800">{fmt(data.coutAlimentaireTotalXOF)} FCFA</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Coût alimentaire / tête / période</td>
                    <td className="py-2 text-right font-medium text-blue-700">{fmt(data.coutAlimentaireParTete)} FCFA</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Taux mortalité</td>
                    <td className={`py-2 text-right font-medium ${data.tauxMortalite > 10 ? 'text-red-600' : 'text-gray-800'}`}>
                      {data.tauxMortalite} %
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Taux mise bas / ponte</td>
                    <td className="py-2 text-right font-medium text-purple-700">{data.tauxMiseBas} %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tips */}
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">Indicateurs de référence</h3>
            <ul className="space-y-1 text-sm text-gray-500">
              <li>• <strong>Taux mortalité</strong> : &lt; 3 % excellent — 3-8 % acceptable — &gt; 8 % à surveiller</li>
              <li>• <strong>Taux mise bas</strong> : objectif &gt; 80 % pour bovins, &gt; 120 % pour ovins/caprins</li>
              <li>• <strong>GMQ</strong> : enregistrez le poids via les logs d&apos;observation pour calculer le gain quotidien</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
