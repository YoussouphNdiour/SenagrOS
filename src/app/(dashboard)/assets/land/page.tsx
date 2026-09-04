import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetListClient } from '@/components/assets/AssetListClient';
import { LandKpis } from '@/components/assets/LandKpis';

export default async function LandPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parcelles</h1>
        <p className="text-sm text-gray-500">Gerez vos parcelles et ilots</p>
      </div>
      <div className="mb-6">
        <LandKpis farmId={session.user.farmId} />
      </div>
      <AssetListClient farmId={session.user.farmId} filterType="land" />
    </div>
  );
}
