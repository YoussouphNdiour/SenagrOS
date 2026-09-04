import { AssetDetailClient } from '@/components/assets/AssetDetailClient';

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssetDetailClient assetId={id} />;
}
