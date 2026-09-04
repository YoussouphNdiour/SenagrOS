import { LogListClient } from '@/components/logs/LogListClient';

export default function SeedingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Semis</h1>
        <p className="text-sm text-gray-500">Logs de type semis</p>
      </div>
      <LogListClient filterType="seeding" />
    </div>
  );
}
