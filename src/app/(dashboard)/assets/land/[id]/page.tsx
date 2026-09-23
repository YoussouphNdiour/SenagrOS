import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { ParcelDetailClient } from '@/components/assets/ParcelDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ParcelDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.farmId) redirect('/dashboard');

  const { id } = await params;

  return <ParcelDetailClient parcelId={id} />;
}
