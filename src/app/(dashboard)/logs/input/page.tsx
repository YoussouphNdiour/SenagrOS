import { LogListClient } from '@/components/logs/LogListClient';

export default function InputPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Applications intrants</h1>
        <p className="text-sm text-gray-500">Logs de type application d'intrants</p>
      </div>
      <LogListClient filterType="input" />
    </div>
  );
}
