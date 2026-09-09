'use client';

import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { RevenueExpenseChart } from '@/components/charts/RevenueExpenseChart';
import { WeatherWidget } from '@/components/charts/WeatherWidget';
import {
  Landmark,
  TrendingUp,
  Bug,
  Rabbit,
  Sprout,
  Package,
  ClipboardList,
  Wallet,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { data, isLoading } = trpc.report.dashboard.useQuery();

  const MODULE_SHORTCUTS = [
    { label: t('moduleAnimaux'), href: '/assets?type=animal', icon: Rabbit, color: 'bg-orange-50 text-orange-600' },
    { label: t('moduleCultures'), href: '/assets?type=plant', icon: Sprout, color: 'bg-green-50 text-green-600' },
    { label: t('moduleStocks'), href: '/intrants', icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: t('moduleTaches'), href: '/logs', icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
    { label: t('moduleComptes'), href: '/reports', icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
    { label: t('moduleJournal'), href: '/logs', icon: BookOpen, color: 'bg-amber-50 text-amber-600' },
  ];

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#43A047] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">{t('patrimoine')}</p>
              <p className="mt-1 text-2xl font-bold">{data.patrimoine} actifs</p>
            </div>
            <div className="rounded-xl bg-white/20 p-3">
              <Landmark className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-[#66BB6A] to-[#81C784] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">{t('beneficeNet')}</p>
              <p className="mt-1 text-2xl font-bold">{formatFCFA(data.beneficeNet)}</p>
            </div>
            <div className="rounded-xl bg-white/20 p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Weather */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={data.monthlyData} />
        </div>
        <div>
          <WeatherWidget />
        </div>
      </div>

      {/* Alerts */}
      {(data.lowStockItems.length > 0 || data.overdueStages.length > 0 || data.pendingTasks > 0) && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-800">{t('alerts')}</h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {data.lowStockItems.length + data.overdueStages.length + (data.pendingTasks > 0 ? 1 : 0)}
            </span>
          </div>
          <div className="space-y-2">
            {data.lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm">
                <Package className="h-4 w-4 text-orange-500" />
                <span className="text-gray-700">
                  {t('stockLow')} : <strong>{item.assetName}</strong> — {item.quantity} {item.unit}
                </span>
              </div>
            ))}
            {data.overdueStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm">
                <Bug className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-700">
                  {t('stageDelayed')} : <strong>{stage.assetName}</strong> — {stage.calendarName}
                </span>
              </div>
            ))}
            {data.pendingTasks > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">
                  <strong>{data.pendingTasks}</strong> {t('pendingTasks')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Shortcuts */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('modules')}</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {MODULE_SHORTCUTS.map((mod) => (
            <Link
              key={mod.label}
              href={mod.href}
              className="flex flex-col items-center gap-2 rounded-xl p-4 transition-colors hover:bg-gray-50"
            >
              <div className={`rounded-xl p-3 ${mod.color}`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-gray-600">{mod.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('recentTasks')}</h3>
        {data.recentLogs.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noTasks')}</p>
        ) : (
          <div className="space-y-2">
            {data.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {log.type}
                  </span>
                  <span className="text-sm text-gray-700">{log.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : log.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
