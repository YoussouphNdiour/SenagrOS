import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { InvoiceCreateForm } from '@/components/finances/InvoiceCreateForm';

export default async function NouvelleFacturePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouveau document</h1>
        <p className="text-sm text-gray-500">
          Créer un devis, une facture pro forma ou une facture de vente
        </p>
      </div>

      <InvoiceCreateForm />
    </div>
  );
}
