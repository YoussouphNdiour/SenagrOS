'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { LogActivityChart } from '@/components/charts/LogActivityChart';
import { ExportBar } from '@/components/charts/ExportBar';
import { Activity, Sprout, Stethoscope, Droplets } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LogsReportPage() {
  const t = useTranslations('reports');
  const tc = useTranslations('common');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const TYPE_LABELS: Record<string, string> = {
    activity: t('logTypeActivity'),
    observation: t('logTypeObservation'),
    input: t('logTypeInput'),
    harvest: t('logTypeHarvest'),
    seeding: t('logTypeSeeding'),
    transplanting: t('logTypeTransplanting'),
    birth: t('logTypeBirth'),
    maintenance: t('logTypeMaintenance'),
    medical: t('logTypeMedical'),
    lab_test: t('logTypeLabTest'),
    movement: t('logTypeMovement'),
    irrigation: t('logTypeIrrigation'),
  };

  const { data, isLoading } = trpc.report.logs.useQuery({
    type: typeFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('logsTitle')}</h1>
        <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  const exportData = data.items.map((item) => ({
    [t('colNomLog')]: item.name,
    [t('colTypeLog')]: TYPE_LABELS[item.type] ?? item.type,
    [t('colStatutLog')]: item.status,
    [t('colDateLog')]: new Date(item.timestamp).toLocaleDateString('fr-FR'),
  }));

  const harvestCount = data.byType.find((t) => t.type === 'harvest')?.count ?? 0;
  const medicalCount = data.byType.find((t) => t.type === 'medical')?.count ?? 0;
  const irrigationCount = data.byType.find((t) => t.type === 'irrigation')?.count ?? 0;

  return (
    <div id="report-logs" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('logsTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('logsSubtitle')}</p>
        </div>
        <ExportBar data={exportData} filename="rapport-activites" pdfElementId="report-logs" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">{tc('type')}</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">{tc('allTypes')}</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title={t('kpiTotalActivites')} value={data.total} icon={Activity} color="green" />
        <KpiCard title={t('kpiRecoltes')} value={harvestCount} icon={Sprout} color="blue" />
        <KpiCard title={t('kpiSoins')} value={medicalCount} icon={Stethoscope} color="orange" />
        <KpiCard title={t('kpiIrrigations')} value={irrigationCount} icon={Droplets} color="purple" />
      </div>

      {/* Chart */}
      <LogActivityChart data={data.byType} />

      {/* Timeline table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-medium text-gray-500">{t('colDateLog')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('colTypeLog')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('colNomLog')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('colStatutLog')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {t('noActivities')}
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
