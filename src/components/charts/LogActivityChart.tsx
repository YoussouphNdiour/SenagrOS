'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TYPE_LABELS: Record<string, string> = {
  activity: 'Activités',
  observation: 'Observations',
  input: 'Intrants',
  harvest: 'Récoltes',
  seeding: 'Semis',
  transplanting: 'Repiquage',
  birth: 'Naissances',
  maintenance: 'Maintenance',
  medical: 'Soins',
  lab_test: 'Analyses',
  movement: 'Mouvements',
  irrigation: 'Irrigation',
};

interface LogTypeData {
  type: string;
  count: number;
}

export function LogActivityChart({ data }: { data: LogTypeData[] }) {
  const chartData = data
    .map((d) => ({
      name: TYPE_LABELS[d.type] ?? d.type,
      count: d.count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Activité par type</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
          <Tooltip />
          <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
