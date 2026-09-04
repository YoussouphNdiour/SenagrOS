import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { PlanDetailClient } from '@/components/plans/PlanDetailClient';

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const { id } = await params;

  return <PlanDetailClient id={id} />;
}
