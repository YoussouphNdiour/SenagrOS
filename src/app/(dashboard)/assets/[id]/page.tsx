import { AssetDetailClient } from '@/components/assets/AssetDetailClient';
import { AnimalDetailClient } from '@/components/assets/AnimalDetailClient';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { assets } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Determine asset type server-side to render the appropriate component
  let isAnimal = false;
  try {
    const session = await auth();
    if (session?.user?.farmId) {
      const [asset] = await db
        .select({ type: assets.type })
        .from(assets)
        .where(and(eq(assets.id, id), eq(assets.farmId, session.user.farmId)))
        .limit(1);
      if (asset?.type === 'animal') {
        isAnimal = true;
      }
    }
  } catch {
    // Fall through to generic detail
  }

  if (isAnimal) {
    return <AnimalDetailClient assetId={id} />;
  }

  return <AssetDetailClient assetId={id} />;
}
