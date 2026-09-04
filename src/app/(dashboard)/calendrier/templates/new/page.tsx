import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { TemplateCreateForm } from '@/components/calendrier/TemplateCreateForm';

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Créer un modèle de calendrier</h1>
        <p className="text-sm text-gray-500">
          Définissez les stades et durées pour une culture
        </p>
      </div>

      <TemplateCreateForm />
    </div>
  );
}
