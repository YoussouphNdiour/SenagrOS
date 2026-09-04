import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { IntrantCreateForm } from '@/components/intrants/IntrantCreateForm';

export default async function NewIntrantPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouvel intrant</h1>
        <p className="text-sm text-gray-500">
          Ajoutez un produit phytosanitaire, engrais ou semence
        </p>
      </div>
      <IntrantCreateForm />
    </div>
  );
}
