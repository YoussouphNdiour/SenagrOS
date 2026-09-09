import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { InvoiceCreateForm } from '@/components/finances/InvoiceCreateForm';

export default async function NouvelleFacturePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const t = await getTranslations('finances');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('factuTitle')}</h1>
        <p className="text-sm text-gray-500">{t('factuSubtitle')}</p>
      </div>

      <InvoiceCreateForm />
    </div>
  );
}
