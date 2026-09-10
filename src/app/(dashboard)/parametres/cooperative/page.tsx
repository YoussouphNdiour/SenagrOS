import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CooperativePageClient } from '@/components/cooperatives/CooperativePageClient';

export default async function CooperativePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coopératives</h1>
        <p className="text-sm text-gray-500">
          Gérez vos coopératives, invitez des fermes et consultez les données agrégées
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        }
      >
        <CooperativePageClient />
      </Suspense>
    </div>
  );
}
