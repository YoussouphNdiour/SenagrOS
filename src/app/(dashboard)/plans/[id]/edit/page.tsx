import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { PlanEditClient } from '@/components/plans/PlanEditClient';

interface PlanEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanEditPage({ params }: PlanEditPageProps) {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const { id } = await params;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Modifier le plan</h1>
        <p className="text-sm text-gray-500">
          Mettez à jour les informations du plan
        </p>
      </div>

      <PlanEditClient id={id} />
    </div>
  );
}
