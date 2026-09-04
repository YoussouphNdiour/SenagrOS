import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { IntrantDetailClient } from '@/components/intrants/IntrantDetailClient';

interface IntrantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IntrantDetailPage({ params }: IntrantDetailPageProps) {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  const { id } = await params;

  return <IntrantDetailClient id={id} />;
}
