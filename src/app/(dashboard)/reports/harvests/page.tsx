'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { HarvestComparisonChart } from '@/components/charts/HarvestComparisonChart';
import { ExportBar } from '@/components/charts/ExportBar';
import { Sprout, Weight, Wallet, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

function formatKg(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

export default function HarvestsReportPage() {
  const t = useTranslations('reports');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = trpc.report.harvests.useQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('harvestsTitle')}</h1>
        <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  const totalKg = data.byCrop.reduce((s, c) => s + c.totalKg, 0);
  const totalValue = data.byCrop.reduce((s, c) => s + c.totalValue, 0);

  const exportData = data.byCrop.map((crop) => ({
    [t('colCulture')]: crop.name,
    [t('colRecolte')]: Math.round(crop.totalKg),
    [t('colValeur')]: Math.round(crop.totalValue),
    [t('colNbRecoltes')]: crop.count,
  }));

  return (
    <div id="report-harvests" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('harvestsTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('harvestsSubtitle')}</p>
        </div>
        <ExportBar data={exportData} filename="rapport-recoltes" pdfElementId="report-harvests" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('filterFrom')}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('filterTo')}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title={t('kpiTotalRecoltes')} value={data.total} icon={Sprout} color="green" />
        <KpiCard title={t('kpiNbCultures')} value={data.byCrop.length} icon={BarChart3} color="blue" />
        <KpiCard title={t('kpiPoidsTotal')} value={`${formatKg(totalKg)} kg`} icon={Weight} color="orange" />
        <KpiCard title={t('kpiValeurTotale')} value={`${formatFCFA(totalValue)} FCFA`} icon={Wallet} color="purple" />
      </div>

      {/* Chart */}
      {data.byCrop.length > 0 && <HarvestComparisonChart data={data.byCrop} />}

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-medium text-gray-500">{t('colCulture')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('colRecolte')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('colValeur')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('colNbRecoltes')}</th>
              </tr>
            </thead>
            <tbody>
              {data.byCrop.map((crop) => (
                <tr key={crop.name} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700">{crop.name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatKg(crop.totalKg)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatFCFA(crop.totalValue)}</td>
                  <td className="px-4 py-3 text-gray-400">{crop.count}</td>
                </tr>
              ))}
              {data.byCrop.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {t('noHarvests')}
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
