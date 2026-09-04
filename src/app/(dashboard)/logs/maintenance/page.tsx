import { LogListClient } from '@/components/logs/LogListClient';

export default function MaintenancePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
        <p className="text-sm text-gray-500">Logs de type maintenance</p>
      </div>
      <LogListClient filterType="maintenance" />
    </div>
  );
}
