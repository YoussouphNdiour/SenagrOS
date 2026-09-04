import { LogListClient } from '@/components/logs/LogListClient';

export default function ActivityPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Activites</h1>
        <p className="text-sm text-gray-500">Logs de type activite</p>
      </div>
      <LogListClient filterType="activity" />
    </div>
  );
}
