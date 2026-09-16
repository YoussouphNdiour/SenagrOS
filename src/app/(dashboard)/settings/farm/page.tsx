import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { FarmSettingsForm } from '@/components/settings/FarmSettingsForm';

export default async function SettingsFarmPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Exploitation</h1>
        <p className="text-sm text-gray-500">Parametres de votre exploitation agricole</p>
      </div>
      <FarmSettingsForm farmId={session.user.farmId} />
    </div>
  );
}
