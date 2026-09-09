import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PlanKpis } from '@/components/plans/PlanKpis';
import { PlanListClient } from '@/components/plans/PlanListClient';

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const t = await getTranslations('plans');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/plans/new"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            + {t('new')}
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <PlanKpis />
      </div>

      <PlanListClient />
    </div>
  );
}
