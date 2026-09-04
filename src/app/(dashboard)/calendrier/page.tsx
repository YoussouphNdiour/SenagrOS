import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendrierKpis } from '@/components/calendrier/CalendrierKpis';
import { TimelineClient } from '@/components/calendrier/TimelineClient';

export default async function CalendrierPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendrier cultural</h1>
          <p className="text-sm text-gray-500">
            Vue timeline des cycles culturaux par parcelle
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/calendrier/templates"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Modèles
          </Link>
          <Link
            href="/calendrier/assign"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            + Assigner
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <CalendrierKpis />
      </div>

      <TimelineClient />
    </div>
  );
}
