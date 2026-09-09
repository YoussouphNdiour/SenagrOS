import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlanCreateForm } from '@/components/plans/PlanCreateForm';

export default async function PlanNewPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const t = await getTranslations('plans');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('new')}</h1>
        <p className="text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      <PlanCreateForm />
    </div>
  );
}
