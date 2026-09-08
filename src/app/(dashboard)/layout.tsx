import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </NextIntlClientProvider>
  );
}
