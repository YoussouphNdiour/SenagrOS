import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { GradingForm } from '@/components/observations/GradingForm';

export default async function NewGradingPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agréage qualité pré-récolte</h1>
        <p className="text-sm text-gray-500">
          Longueurs, défauts majeurs, indice de maturité
        </p>
      </div>
      <GradingForm />
    </div>
  );
}
