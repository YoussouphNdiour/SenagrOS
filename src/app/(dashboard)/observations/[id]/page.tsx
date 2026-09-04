import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { ObservationDetailClient } from '@/components/observations/ObservationDetailClient';

interface ObservationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ObservationDetailPage({ params }: ObservationDetailPageProps) {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const { id } = await params;

  return <ObservationDetailClient id={id} />;
}
