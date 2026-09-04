import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { PlanCreateForm } from '@/components/plans/PlanCreateForm';

export default async function PlanNewPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouveau plan</h1>
        <p className="text-sm text-gray-500">
          Créez un plan de campagne pour organiser vos activités
        </p>
      </div>

      <PlanCreateForm />
    </div>
  );
}
