import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/settings/ProfileForm';

export default async function SettingsProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profil</h1>
        <p className="text-sm text-gray-500">Gerez vos informations personnelles</p>
      </div>
      <ProfileForm
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </div>
  );
}
