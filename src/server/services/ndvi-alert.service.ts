/**
 * Detection des chutes de NDVI et generation des notifications associees.
 *
 * Les seuils ci-dessous sont des valeurs par defaut assumees, pas un
 * referentiel agronomique. Ils visent un compromis : alerter sur une perte
 * de vigueur reelle sans se declencher a chaque oscillation.
 */

import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import type { db as Database } from '../db';
import { assets, notifications } from '../db/schema';
import { fetchIndexTimeSeries } from '@/lib/sentinel-hub';
import { fetchRainfallHistory } from '@/lib/weather';

/** Chute relative minimale entre les deux dernieres mesures. */
export const DROP_RELATIVE = 0.2;
/** Chute absolue minimale, pour ignorer le bruit sur les valeurs basses. */
export const DROP_ABSOLUTE = 0.1;
/**
 * NDVI minimal avant la chute. En dessous, il n'y avait pas de couvert a
 * perdre : une variation sur sol nu n'est pas un signal agronomique.
 */
export const MIN_PREVIOUS = 0.3;
/**
 * Delai avant de re-alerter sur la meme parcelle. Cale sur le pas
 * d'agregation P14D : en deca, aucune mesure nouvelle n'est disponible.
 */
export const REALERT_DAYS = 14;
/** Profondeur d'historique interrogee pour disposer de deux mesures. */
const LOOKBACK_MONTHS = 3;
/** Fenetre de pluie annexee a l'alerte pour orienter le diagnostic. */
const RAIN_WINDOW_DAYS = 21;

export const NDVI_DROP_NOTIFICATION_TYPE = 'ndvi_drop';

export interface NdviPoint {
  date: string;
  value: number;
}

export interface DropVerdict {
  dropped: boolean;
  previous?: NdviPoint;
  latest?: NdviPoint;
  /** Chute relative, ex. 0.34 pour -34 %. */
  relative?: number;
  absolute?: number;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Compare les deux dernieres mesures d'une serie NDVI.
 *
 * Fonction pure : toute la decision d'alerte tient ici, ce qui la rend
 * testable sans reseau ni base.
 */
export function detectDrop(points: NdviPoint[]): DropVerdict {
  if (points.length < 2) return { dropped: false };

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  // Arrondi avant comparaison : en binaire, 0.5 - 0.4 vaut 0.09999999999999998
  // et passerait sous un seuil de 0.10, faisant manquer une alerte legitime.
  // Les valeurs NDVI arrivent deja arrondies au millieme.
  const absolute = round4(previous.value - latest.value);
  const relative = previous.value === 0 ? 0 : round4(absolute / previous.value);

  const dropped =
    previous.value >= MIN_PREVIOUS &&
    absolute >= DROP_ABSOLUTE &&
    relative >= DROP_RELATIVE;

  return { dropped, previous, latest, relative, absolute };
}

/** Formule le message d'alerte, en y joignant le contexte pluviometrique. */
export function buildDropMessage(
  parcelName: string,
  verdict: DropVerdict,
  rainMm: number | null,
): string {
  const pct = Math.round((verdict.relative ?? 0) * 100);
  const from = verdict.previous?.value.toFixed(2);
  const to = verdict.latest?.value.toFixed(2);

  const base = `NDVI en baisse de ${pct} % sur ${parcelName} (${from} vers ${to}).`;

  if (rainMm === null) {
    return `${base} Pluviometrie indisponible.`;
  }
  if (rainMm < 10) {
    return `${base} Seulement ${rainMm} mm de pluie sur ${RAIN_WINDOW_DAYS} jours : piste du deficit hydrique a examiner en premier.`;
  }
  return `${base} ${rainMm} mm de pluie sur ${RAIN_WINDOW_DAYS} jours, donc une cause autre que le manque d'eau est probable (ravageur, maladie, carence) — sauf recolte ou fin de cycle en cours.`;
}

interface CheckResult {
  checked: number;
  alerted: number;
  skippedRecent: number;
}

/**
 * Parcourt les parcelles geolocalisees d'une ferme et cree une notification
 * pour chaque chute detectee.
 *
 * Une parcelle deja signalee depuis moins de REALERT_DAYS est ignoree, sans
 * appel satellite : c'est ce qui rend l'operation reexecutable sans inonder
 * l'utilisateur ni le quota Sentinel Hub.
 */
export async function checkNdviDrops(
  db: typeof Database,
  farmId: string,
  userId: string,
): Promise<CheckResult> {
  const parcels = await db
    .select({
      id: assets.id,
      name: assets.name,
      data: assets.data,
      lat: sql<number | null>`ST_Y(ST_Centroid(${assets.geometry}))`.as('lat'),
      lng: sql<number | null>`ST_X(ST_Centroid(${assets.geometry}))`.as('lng'),
    })
    .from(assets)
    .where(
      and(eq(assets.type, 'land'), eq(assets.farmId, farmId), isNull(assets.archivedAt)),
    );

  const since = new Date();
  since.setDate(since.getDate() - REALERT_DAYS);

  const recent = await db
    .select({ entityId: notifications.entityId })
    .from(notifications)
    .where(
      and(
        eq(notifications.farmId, farmId),
        eq(notifications.type, NDVI_DROP_NOTIFICATION_TYPE),
        gte(notifications.createdAt, since),
      ),
    )
    .orderBy(desc(notifications.createdAt));

  const alreadyAlerted = new Set(recent.map((r) => r.entityId).filter(Boolean));

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - LOOKBACK_MONTHS);

  const result: CheckResult = { checked: 0, alerted: 0, skippedRecent: 0 };

  for (const parcel of parcels) {
    if (alreadyAlerted.has(parcel.id)) {
      result.skippedRecent++;
      continue;
    }

    const coordinates = (parcel.data as Record<string, unknown> | null)?.coordinates as
      | number[][][]
      | undefined;
    if (!coordinates || coordinates.length === 0) continue;

    result.checked++;

    const series = await fetchIndexTimeSeries(
      'ndvi',
      coordinates,
      fromDate.toISOString(),
      toDate.toISOString(),
    );

    const verdict = detectDrop(series);
    if (!verdict.dropped) continue;

    let rainMm: number | null = null;
    if (parcel.lat != null && parcel.lng != null) {
      const rain = await fetchRainfallHistory(parcel.lat, parcel.lng, RAIN_WINDOW_DAYS);
      if (rain.length > 0) {
        rainMm = Math.round(rain.reduce((sum, d) => sum + d.mm, 0) * 10) / 10;
      }
    }

    await db.insert(notifications).values({
      farmId,
      userId,
      type: NDVI_DROP_NOTIFICATION_TYPE,
      title: `Baisse de vigueur — ${parcel.name}`,
      message: buildDropMessage(parcel.name, verdict, rainMm),
      entityType: 'asset',
      entityId: parcel.id,
    });

    result.alerted++;
  }

  return result;
}
