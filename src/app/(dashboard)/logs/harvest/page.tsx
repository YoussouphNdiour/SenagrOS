import { LogListClient } from '@/components/logs/LogListClient';

export default function HarvestPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recoltes</h1>
        <p className="text-sm text-gray-500">Logs de type recolte</p>
      </div>
      <LogListClient filterType="harvest" />
    </div>
  );
}
