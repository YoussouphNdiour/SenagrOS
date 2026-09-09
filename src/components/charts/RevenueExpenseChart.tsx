'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslations } from 'next-intl';

interface MonthlyData {
  month: number;
  revenue: number;
  expenses: number;
}

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function RevenueExpenseChart({ data }: { data: MonthlyData[] }) {
  const t = useTranslations('reports');

  // Use locale-aware month abbreviations
  const getMonthLabel = (monthIndex: number): string => {
    const date = new Date(2000, monthIndex, 1);
    return date.toLocaleDateString('fr-FR', { month: 'short' });
  };

  const chartData = data.map((d) => ({
    name: getMonthLabel(d.month - 1),
    [t('chartRevenu')]: d.revenue,
    [t('chartDepense')]: d.expenses,
  }));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-gray-800">{t('chartRevenuExpense')}</h3>
      <p className="mb-4 text-xs text-gray-400">{t('chartEvolution')}</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatFCFA} />
          <Tooltip formatter={(v) => `${formatFCFA(Number(v))} FCFA`} />
          <Legend />
          <Bar dataKey={t('chartRevenu')} fill="#2E7D32" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t('chartDepense')} fill="#F57C00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
