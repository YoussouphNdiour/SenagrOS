import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssignCalendarForm } from '@/components/calendrier/AssignCalendarForm';

export default async function AssignCalendarPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assigner un calendrier</h1>
        <p className="text-sm text-gray-500">
          Associez un modèle de calendrier à une parcelle avec une date de semis
        </p>
      </div>

      <AssignCalendarForm />
    </div>
  );
}
