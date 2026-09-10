import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetListClient } from '@/components/assets/AssetListClient';

export default async function PlantPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cultures</h1>
        <p className="text-sm text-gray-500">Gerez vos cultures et plantations</p>
      </div>
      <AssetListClient farmId={session.user.farmId} filterType="plant" />
    </div>
  );
}
