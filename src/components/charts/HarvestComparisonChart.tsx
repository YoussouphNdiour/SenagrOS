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

interface CropData {
  name: string;
  totalKg: number;
  totalValue: number;
  count: number;
}

function formatKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} kg`;
}

export function HarvestComparisonChart({ data }: { data: CropData[] }) {
  const chartData = data.map((d) => ({
    name: d.name,
    'Récolté (kg)': Math.round(d.totalKg),
    'Valeur (FCFA)': Math.round(d.totalValue),
  }));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Rendements par culture</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="kg" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} kg`} />
          <YAxis yAxisId="value" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="kg" dataKey="Récolté (kg)" fill="#2E7D32" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="value" dataKey="Valeur (FCFA)" fill="#1565C0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
