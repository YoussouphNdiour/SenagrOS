import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TemplateListClient } from '@/components/calendrier/TemplateListClient';

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Modèles de calendrier</h1>
          <p className="text-sm text-gray-500">
            Définissez les stades par culture/variété
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/calendrier"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Timeline
          </Link>
          <Link
            href="/calendrier/templates/new"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            + Nouveau modèle
          </Link>
        </div>
      </div>

      <TemplateListClient />
    </div>
  );
}
