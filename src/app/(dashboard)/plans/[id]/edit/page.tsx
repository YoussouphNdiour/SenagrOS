import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlanEditClient } from '@/components/plans/PlanEditClient';

interface PlanEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanEditPage({ params }: PlanEditPageProps) {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const t = await getTranslations('plans');
  const tc = await getTranslations('common');

  const { id } = await params;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{tc('edit')} — {t('title')}</h1>
        <p className="text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      <PlanEditClient id={id} />
    </div>
  );
}
