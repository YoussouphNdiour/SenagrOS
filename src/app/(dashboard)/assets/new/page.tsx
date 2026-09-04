import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetCreateForm } from '@/components/assets/AssetCreateForm';

export default async function NewAssetPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouvel asset</h1>
        <p className="text-sm text-gray-500">Ajoutez un nouvel element a votre patrimoine</p>
      </div>
      <AssetCreateForm farmId={session.user.farmId} />
    </div>
  );
}
