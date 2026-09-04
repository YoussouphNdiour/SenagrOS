import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { StageForm } from '@/components/observations/StageForm';

export default async function NewStagePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suivi stade cultural</h1>
        <p className="text-sm text-gray-500">
          Enregistrer le stade atteint par la culture
        </p>
      </div>
      <StageForm />
    </div>
  );
}
