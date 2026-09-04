import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { VenteCreateForm } from '@/components/finances/VenteCreateForm';

export default async function NouvelleVentePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouvelle vente</h1>
        <p className="text-sm text-gray-500">
          Enregistrer une nouvelle vente de produit
        </p>
      </div>

      <VenteCreateForm />
    </div>
  );
}
