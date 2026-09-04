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

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

interface MonthlyData {
  month: number;
  revenue: number;
  expenses: number;
}

function formatFCFA(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function RevenueExpenseChart({ data }: { data: MonthlyData[] }) {
  const chartData = data.map((d) => ({
    name: MONTH_LABELS[d.month - 1],
    Revenus: d.revenue,
    Dépenses: d.expenses,
  }));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-gray-800">Revenus & Dépenses</h3>
      <p className="mb-4 text-xs text-gray-400">Évolution mensuelle — en FCFA</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatFCFA} />
          <Tooltip formatter={(v) => `${formatFCFA(Number(v))} FCFA`} />
          <Legend />
          <Bar dataKey="Revenus" fill="#2E7D32" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Dépenses" fill="#F57C00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
