import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetEditForm } from '@/components/assets/AssetEditForm';

export default async function AssetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/login');
  }

  const { id } = await params;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Modifier l&apos;asset</h1>
        <p className="text-sm text-gray-500">Modifiez les informations de cet element</p>
      </div>
      <AssetEditForm assetId={id} farmId={session.user.farmId} />
    </div>
  );
}
