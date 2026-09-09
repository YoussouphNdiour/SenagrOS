import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FacturationKpis } from '@/components/finances/FacturationKpis';
import { InvoiceListClient } from '@/components/finances/InvoiceListClient';

export default async function FacturationPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const t = await getTranslations('finances');
  const tc = await getTranslations('common');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('factuTitle')}</h1>
          <p className="text-sm text-gray-500">{t('factuSubtitle')}</p>
        </div>
        <Link
          href="/facturation/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          + {tc('new')}
        </Link>
      </div>

      <div className="mb-6">
        <FacturationKpis />
      </div>

      <InvoiceListClient />
    </div>
  );
}
