import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { farms } from '@/server/db/schema';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const messages = await getMessages();

  // Fetch farm name for FarmSwitcher
  let farmName: string | null = null;
  if (session.user.farmId) {
    const [farm] = await db
      .select({ name: farms.name })
      .from(farms)
      .where(eq(farms.id, session.user.farmId))
      .limit(1);
    farmName = farm?.name ?? null;
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <DashboardShell user={{ ...session.user, farmName }}>{children}</DashboardShell>
    </NextIntlClientProvider>
  );
}
