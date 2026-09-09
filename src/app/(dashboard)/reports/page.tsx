'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { RevenueExpenseChart } from '@/components/charts/RevenueExpenseChart';
import { AssetDistributionChart } from '@/components/charts/AssetDistributionChart';
import { LogActivityChart } from '@/components/charts/LogActivityChart';
import { ExportBar } from '@/components/charts/ExportBar';
import { Landmark, TrendingUp, Activity, Sprout } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function ReportsPage() {
  const t = useTranslations('reports');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: dashboard, isLoading: dashLoading } = trpc.report.dashboard.useQuery();
  const { data: assetsReport } = trpc.report.assets.useQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: logsReport } = trpc.report.logs.useQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (dashLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const exportData = [
    { Metrique: t('metriquePatrimoine'), Valeur: dashboard.patrimoine },
    { Metrique: t('metriqueRevenus'), Valeur: dashboard.totalRevenue },
    { Metrique: t('metriqueDepenses'), Valeur: dashboard.totalExpenses },
    { Metrique: t('metriqueBenefice'), Valeur: dashboard.beneficeNet },
  ];

  return (
    <div id="report-content" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <ExportBar data={exportData} filename="rapport-general" pdfElementId="report-content" />
      </div>

      {/* Date filters */}
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('kpiPatrimoine')}
          value={`${dashboard.patrimoine} ${t('actifs')}`}
          icon={Landmark}
          color="green"
        />
        <KpiCard
          title={t('kpiRevenus')}
          value={`${formatFCFA(dashboard.totalRevenue)} FCFA`}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          title={t('kpiDepenses')}
          value={`${formatFCFA(dashboard.totalExpenses)} FCFA`}
          icon={Activity}
          color="orange"
        />
        <KpiCard
          title={t('kpiBenefice')}
          value={`${formatFCFA(dashboard.beneficeNet)} FCFA`}
          icon={Sprout}
          color={dashboard.beneficeNet >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueExpenseChart data={dashboard.monthlyData} />
        {assetsReport && <AssetDistributionChart data={assetsReport.byType} />}
      </div>

      {logsReport && (
        <LogActivityChart data={logsReport.byType} />
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/reports/assets"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center transition-colors hover:border-green-300 hover:bg-green-50"
        >
          <Landmark className="mx-auto mb-2 h-8 w-8 text-green-600" />
          <p className="font-medium text-gray-700">{t('linkPatrimoine')}</p>
          <p className="text-xs text-gray-400">{t('linkPatrimoineDesc')}</p>
        </Link>
        <Link
          href="/reports/logs"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center transition-colors hover:border-green-300 hover:bg-green-50"
        >
          <Activity className="mx-auto mb-2 h-8 w-8 text-blue-600" />
          <p className="font-medium text-gray-700">{t('linkActivities')}</p>
          <p className="text-xs text-gray-400">{t('linkActivitiesDesc')}</p>
        </Link>
        <Link
          href="/reports/harvests"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center transition-colors hover:border-green-300 hover:bg-green-50"
        >
          <Sprout className="mx-auto mb-2 h-8 w-8 text-orange-600" />
          <p className="font-medium text-gray-700">{t('linkHarvests')}</p>
          <p className="text-xs text-gray-400">{t('linkHarvestsDesc')}</p>
        </Link>
      </div>
    </div>
  );
}
