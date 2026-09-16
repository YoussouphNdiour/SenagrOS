import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { UsersManager } from '@/components/settings/UsersManager';

export default async function SettingsUsersPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Membres</h1>
        <p className="text-sm text-gray-500">Gerez les membres de votre exploitation</p>
      </div>
      <UsersManager />
    </div>
  );
}
