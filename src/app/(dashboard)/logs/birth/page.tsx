import { LogListClient } from '@/components/logs/LogListClient';

export default function BirthPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Naissances</h1>
        <p className="text-sm text-gray-500">Logs de type naissance</p>
      </div>
      <LogListClient filterType="birth" />
    </div>
  );
}
