import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <OfflineBanner />
      <ServiceWorkerRegistrar />
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </>
  );
}
