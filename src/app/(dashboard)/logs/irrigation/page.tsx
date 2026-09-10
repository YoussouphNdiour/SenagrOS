import { LogListClient } from '@/components/logs/LogListClient';

export default function IrrigationPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Irrigation</h1>
        <p className="text-sm text-gray-500">Suivi des arrosages et de la consommation d&apos;eau</p>
      </div>
      <LogListClient filterType="irrigation" />
    </div>
  );
}
