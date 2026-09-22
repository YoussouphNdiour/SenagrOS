import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { auth } from '@/server/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <OfflineBanner />
      <ServiceWorkerRegistrar />
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </NextIntlClientProvider>
  );
}
