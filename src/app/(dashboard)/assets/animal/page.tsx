import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AnimalListClient } from '@/components/assets/AnimalListClient';

export default async function AnimalPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Animaux</h1>
        <p className="text-sm text-gray-500">Gerez votre cheptel et elevage</p>
      </div>
      <AnimalListClient farmId={session.user.farmId} />
    </div>
  );
}
