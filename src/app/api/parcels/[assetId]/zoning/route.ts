import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { assets } from '@/server/db/schema';
import { SPECTRAL_INDICES, type SpectralIndex, fetchIndexImage } from '@/lib/sentinel-hub';

/** Profondeur de recherche d'une scene exploitable. */
const LOOKBACK_DAYS = 30;

/**
 * Image de zonage d'une parcelle, en PNG transparent.
 *
 * Servie par un gestionnaire de route et non par tRPC : le transport d'une
 * image binaire en JSON imposerait un encodage base64, soit un tiers de
 * volume en plus, sans benefice.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const session = await auth();
  const farmId = session?.user?.farmId;
  if (!farmId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { assetId } = await params;
  const requested = new URL(request.url).searchParams.get('index') ?? 'ndvi';
  if (!(requested in SPECTRAL_INDICES)) {
    return NextResponse.json({ error: 'Indice inconnu' }, { status: 400 });
  }
  const index = requested as SpectralIndex;

  // La parcelle doit appartenir a la ferme de la session : sans ce controle,
  // l'identifiant suffirait a lire l'imagerie d'une autre exploitation.
  const [asset] = await db
    .select({ id: assets.id, data: assets.data })
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.farmId, farmId), isNull(assets.archivedAt)))
    .limit(1);

  if (!asset) {
    return NextResponse.json({ error: 'Parcelle introuvable' }, { status: 404 });
  }

  const coordinates = (asset.data as Record<string, unknown> | null)?.coordinates as
    | number[][][]
    | undefined;

  if (!coordinates || coordinates.length === 0) {
    return NextResponse.json({ error: 'Parcelle sans géométrie' }, { status: 422 });
  }

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - LOOKBACK_DAYS);

  const image = await fetchIndexImage(
    index,
    coordinates,
    fromDate.toISOString(),
    toDate.toISOString(),
  );

  if (!image) {
    return NextResponse.json({ error: 'Imagerie indisponible' }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(image.png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      // Une scene Sentinel-2 ne change pas en quelques heures, et chaque appel
      // consomme du quota : le cache privé evite de redemander a chaque
      // affichage du calque.
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
