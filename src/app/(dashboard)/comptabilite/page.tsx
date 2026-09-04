import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { ComptabiliteClient } from '@/components/finances/ComptabiliteClient';

export default async function ComptabilitePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Comptabilité</h1>
          <p className="text-sm text-gray-500">
            Bilan, clôture mensuelle et exports comptables
          </p>
        </div>
      </div>

      <ComptabiliteClient />
    </div>
  );
}
