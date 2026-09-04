import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { DensityForm } from '@/components/observations/DensityForm';

export default async function NewDensityPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fiche Densité de levée</h1>
        <p className="text-sm text-gray-500">
          Comptage des plants par répétition — calculs automatiques
        </p>
      </div>
      <DensityForm />
    </div>
  );
}
