import { StockDetailClient } from '@/components/stocks/StockDetailClient';

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  return <StockDetailClient assetId={assetId} />;
}
