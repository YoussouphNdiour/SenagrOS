'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#2E7D32', '#43A047', '#66BB6A', '#81C784',
  '#F57C00', '#FFB74D', '#1565C0', '#42A5F5',
  '#7B1FA2', '#AB47BC', '#D32F2F', '#EF5350',
];

const TYPE_LABELS: Record<string, string> = {
  land: 'Parcelles',
  plant: 'Cultures',
  animal: 'Animaux',
  equipment: 'Équipements',
  structure: 'Structures',
  material: 'Intrants',
  sensor: 'Capteurs',
  water: 'Eau',
  seed: 'Semences',
  product: 'Produits',
  compost: 'Compost',
  group: 'Groupes',
};

interface AssetTypeData {
  type: string;
  count: number;
}

export function AssetDistributionChart({ data }: { data: AssetTypeData[] }) {
  const chartData = data.map((d) => ({
    name: TYPE_LABELS[d.type] ?? d.type,
    value: d.count,
  }));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Répartition du patrimoine</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
