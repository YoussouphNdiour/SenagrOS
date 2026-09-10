import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetListClient } from '@/components/assets/AssetListClient';

export default async function EquipmentPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipements</h1>
        <p className="text-sm text-gray-500">Gerez vos equipements et materiel agricole</p>
      </div>
      <AssetListClient farmId={session.user.farmId} filterType="equipment" />
    </div>
  );
}
