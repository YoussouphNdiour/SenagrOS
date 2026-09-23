'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sprout, TrendingUp, Coins, BarChart3, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function yieldDiff(prevu: number | null, reel: number | null): { label: string; color: string } | null {
  if (prevu == null || reel == null || prevu === 0) return null;
  const pct = Math.round(((reel - prevu) / prevu) * 100);
  return {
    label: `${pct >= 0 ? '+' : ''}${pct}% vs objectif`,
    color: pct >= 0 ? 'text-green-600' : 'text-red-600',
  };
}

export default function VegetalTdbPage() {
  const thisYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${thisYear}-01-01`);
  const [dateTo, setDateTo] = useState(`${thisYear}-12-31`);

  const { data, isLoading } = trpc.report.cropKpis.useQuery({ dateFrom, dateTo });

  const summary = data?.summary;
  const parcels = data?.parcels ?? [];
  const activeParcels = parcels.filter((p) => p.status === 'active');

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
          <h1 className="text-2xl font-bold text-gray-800">TDB Technique Végétal</h1>
          <p className="text-sm text-gray-500">
            Rendements, coûts intrants et marges par parcelle
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

      {isLoading || !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Parcelles actives"
              value={`${summary.activeParcels} / ${summary.totalParcels}`}
              icon={Sprout}
              color="green"
            />
            <KpiCard
              title="Récolte totale"
              value={`${fmt(summary.totalHarvestKg)} kg`}
              icon={BarChart3}
              color="blue"
            />
            <KpiCard
              title="Coût intrants total"
              value={`${fmt(summary.totalInputCostXOF)} FCFA`}
              icon={Coins}
              color="orange"
            />
            <KpiCard
              title="Calendriers suivis"
              value={`${summary.totalParcels}`}
              icon={TrendingUp}
              color="purple"
            />
          </div>

          {/* Parcels table */}
          {parcels.length === 0 ? (
            <Card>
              <div className="py-8 text-center text-gray-500">
                <Sprout className="mx-auto mb-3 h-10 w-10 text-green-200" />
                <p className="font-medium">Aucun calendrier cultural</p>
                <p className="mt-1 text-sm">
                  Assignez un calendrier à vos parcelles depuis la page{' '}
                  <Link href="/calendrier" className="text-green-600 underline">Calendriers</Link>
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="mb-4 text-base font-semibold text-gray-700">Détail par parcelle</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                      <th className="pb-2 pr-4">Parcelle</th>
                      <th className="pb-2 pr-4">Culture</th>
                      <th className="pb-2 pr-4 text-right">Rdt prévu (kg/ha)</th>
                      <th className="pb-2 pr-4 text-right">Rdt réel (kg/ha)</th>
                      <th className="pb-2 pr-4 text-right">Récolte (kg)</th>
                      <th className="pb-2 pr-4 text-right">Coût intrant</th>
                      <th className="pb-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parcels.map((p) => {
                      const diff = yieldDiff(p.rendementPrevuKgHa, p.rendementReelKgHa);
                      return (
                        <tr key={p.parcelId} className="hover:bg-gray-50">
                          <td className="py-2 pr-4 font-medium text-gray-800">{p.parcelName}</td>
                          <td className="py-2 pr-4 text-gray-500">
                            {p.cropType}
                            {p.variety && ` (${p.variety})`}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-500">
                            {p.rendementPrevuKgHa != null ? fmt(p.rendementPrevuKgHa) : '—'}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            <span className="font-medium text-gray-800">
                              {p.rendementReelKgHa != null ? fmt(p.rendementReelKgHa) : '—'}
                            </span>
                            {diff && (
                              <span className={`ml-1 text-xs ${diff.color}`}>{diff.label}</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-right font-medium text-green-700">
                            {p.rendementReelKgTotal > 0 ? fmt(p.rendementReelKgTotal) : '—'}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-600">
                            {p.coutIntrantXOF > 0 ? `${fmt(p.coutIntrantXOF)} FCFA` : '—'}
                          </td>
                          <td className="py-2">
                            <Badge
                              variant={p.status === 'active' ? 'info' : p.status === 'completed' ? 'success' : 'default'}
                            >
                              {p.status === 'active' ? 'Actif' : p.status === 'completed' ? 'Terminé' : p.status ?? '—'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Info */}
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">Comment enrichir ces données</h3>
            <ul className="space-y-1 text-sm text-gray-500">
              <li>• <strong>Rendement prévu</strong> : définissez-le lors de l&apos;assignation du calendrier cultural</li>
              <li>• <strong>Rendement réel</strong> : enregistrez les logs de type &quot;Récolte&quot; liés à la parcelle avec une quantité en kg</li>
              <li>• <strong>Coût intrant/ha</strong> : enregistrez les logs &quot;Intrant&quot; liés à la parcelle avec un montant en FCFA</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
