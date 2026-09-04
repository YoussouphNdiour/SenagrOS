import { LogListClient } from '@/components/logs/LogListClient';
import { LogKpis } from '@/components/logs/LogKpis';

export default function LogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Journal d'activites</h1>
        <p className="text-sm text-gray-500">Tous les logs d'intervention</p>
      </div>
      <div className="mb-6">
        <LogKpis />
      </div>
      <LogListClient />
    </div>
  );
}
