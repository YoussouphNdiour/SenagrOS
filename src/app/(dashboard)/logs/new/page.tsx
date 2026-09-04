import { LogCreateForm } from '@/components/logs/LogCreateForm';

export default function NewLogPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouveau log</h1>
        <p className="text-sm text-gray-500">Enregistrer une nouvelle intervention</p>
      </div>
      <LogCreateForm />
    </div>
  );
}
