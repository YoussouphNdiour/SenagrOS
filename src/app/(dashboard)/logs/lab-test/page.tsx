import { LogListClient } from '@/components/logs/LogListClient';

export default function LabTestPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analyses labo</h1>
        <p className="text-sm text-gray-500">Logs de type analyse laboratoire</p>
      </div>
      <LogListClient filterType="lab_test" />
    </div>
  );
}
