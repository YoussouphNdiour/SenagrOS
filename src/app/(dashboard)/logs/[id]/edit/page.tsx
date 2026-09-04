import { LogEditClient } from '@/components/logs/LogEditClient';

export default async function LogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Modifier le log</h1>
        <p className="text-sm text-gray-500">Mise a jour des informations</p>
      </div>
      <LogEditClient logId={id} />
    </div>
  );
}
