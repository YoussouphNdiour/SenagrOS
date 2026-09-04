import { LogListClient } from '@/components/logs/LogListClient';

export default function MedicalPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Soins medicaux</h1>
        <p className="text-sm text-gray-500">Logs de type soins medicaux</p>
      </div>
      <LogListClient filterType="medical" />
    </div>
  );
}
