import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { PestDiseaseForm } from '@/components/observations/PestDiseaseForm';

export default async function NewPestDiseasePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fiche Maladies-Ravageurs</h1>
        <p className="text-sm text-gray-500">
          Grille d'observation des ravageurs et maladies par cible
        </p>
      </div>
      <PestDiseaseForm />
    </div>
  );
}
