import { LogListClient } from '@/components/logs/LogListClient';

export default function TransplantingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Repiquages</h1>
        <p className="text-sm text-gray-500">Logs de type repiquage</p>
      </div>
      <LogListClient filterType="transplanting" />
    </div>
  );
}
