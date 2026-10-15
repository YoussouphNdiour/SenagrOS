/**
 * Sentinel Hub client for Copernicus Data Space Ecosystem (free tier)
 * Fetches spectral index time series using the Statistical API with
 * Sentinel-2 L2A data.
 *
 * Required env vars:
 *   SENTINEL_HUB_CLIENT_ID
 *   SENTINEL_HUB_CLIENT_SECRET
 */

const TOKEN_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const STATISTICS_URL =
  'https://sh.dataspace.copernicus.eu/api/v1/statistics';

/**
 * Indices normalises supportes, tous de la forme (a - b) / (a + b).
 *
 * - ndvi : vigueur de la vegetation (B08 proche infrarouge, B04 rouge, 10 m).
 * - ndmi : teneur en eau de la vegetation, donc stress hydrique (B08, B11
 *   moyen infrarouge a 20 m). A ne pas confondre avec le NDWI de McFeeters
 *   (B03/B08), qui detecte les plans d'eau libre et non l'etat des cultures.
 */
export const SPECTRAL_INDICES = {
  ndvi: { numerator: 'B08', denominator: 'B04' },
  ndmi: { numerator: 'B08', denominator: 'B11' },
} as const;

export type SpectralIndex = keyof typeof SPECTRAL_INDICES;

// Masque les nuages et pixels invalides via la bande SCL. La Statistical API
// exige une sortie dataMask pour savoir quels pixels exclure de l'agregation.
function buildEvalscript(index: SpectralIndex): string {
  const { numerator, denominator } = SPECTRAL_INDICES[index];
  return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["${numerator}", "${denominator}", "SCL"], units: "DN" }],
    output: [
      { id: "${index}", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1, sampleType: "UINT8" }
    ]
  };
}
function evaluatePixel(sample) {
  // Classes SCL exclues : 0=no data, 1=sature, 3=ombre de nuage,
  // 8=nuage probable, 9=nuage tres probable, 10=cirrus
  const isInvalid = [0, 1, 3, 8, 9, 10].includes(sample.SCL);
  const value = isInvalid
    ? 0
    : (sample.${numerator} - sample.${denominator}) / (sample.${numerator} + sample.${denominator});
  return { ${index}: [value], dataMask: [isInvalid ? 0 : 1] };
}`;
}

// ---------------------------------------------------------------------------
// OAuth2 token cache
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Sentinel Hub credentials not configured');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentinel Hub token error (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = json.access_token;
  // Refresh 30 s before actual expiry to avoid edge-case failures
  tokenExpiresAt = now + (json.expires_in - 30) * 1000;

  return cachedToken;
}

// ---------------------------------------------------------------------------
// Series temporelles d'indices
// ---------------------------------------------------------------------------
export interface IndexDataPoint {
  date: string;
  value: number;
}

/**
 * Moyenne d'un indice spectral par intervalle de 14 jours sur un polygone.
 *
 * @param index    Indice a calculer ('ndvi' ou 'ndmi')
 * @param polygon  Coordonnees du polygone GeoJSON (number[][][]), en EPSG:4326
 * @param fromDate Date ISO (ex. "2025-09-01T00:00:00Z")
 * @param toDate   Date ISO
 * @returns Points { date, value } tries chronologiquement, intervalles sans
 *          pixel valide exclus. Tableau vide en cas d'echec reseau ou API.
 */
export async function fetchIndexTimeSeries(
  index: SpectralIndex,
  polygon: number[][][],
  fromDate: string,
  toDate: string,
): Promise<IndexDataPoint[]> {
  try {
    const token = await getAccessToken();

    const requestBody = {
      input: {
        bounds: {
          geometry: {
            type: 'Polygon' as const,
            coordinates: polygon,
          },
        },
        data: [
          {
            dataFilter: {
              timeRange: { from: fromDate, to: toDate },
            },
            type: 'sentinel-2-l2a',
          },
        ],
      },
      aggregation: {
        timeRange: { from: fromDate, to: toDate },
        aggregationInterval: { of: 'P14D' },
        evalscript: buildEvalscript(index),
      },
    };

    const res = await fetch(STATISTICS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Sentinel Hub Statistics API error (${res.status}): ${text}`);
      return [];
    }

    const json = (await res.json()) as {
      data?: Array<{
        interval: { from: string; to: string };
        outputs: Record<
          string,
          {
            bands: {
              B0: {
                stats: {
                  mean: number;
                  sampleCount: number;
                  noDataCount: number;
                };
              };
            };
          }
        >;
      }>;
    };

    if (!json.data) return [];

    return json.data
      .map((interval) => {
        const stats = interval.outputs?.[index]?.bands?.B0?.stats;
        if (!stats) return null;
        const { mean, sampleCount, noDataCount } = stats;
        // Intervalle sans aucun pixel valide (tout masque par dataMask)
        if (noDataCount === sampleCount) return null;
        if (mean == null || Number.isNaN(mean)) return null;
        return {
          date: interval.interval.from.split('T')[0],
          value: Math.round(mean * 1000) / 1000,
        };
      })
      .filter((d): d is IndexDataPoint => d !== null);
  } catch (error) {
    console.error(`Failed to fetch ${index} time series:`, error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Zonage intra-parcellaire
// ---------------------------------------------------------------------------

const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

/** Resolution native des bandes rouge et proche infrarouge. */
const NATIVE_RESOLUTION_M = 10;
const MIN_IMAGE_SIDE = 64;
const MAX_IMAGE_SIDE = 1024;

/** Bornes geographiques, en degres : [ouest, sud, est, nord]. */
export type BoundingBox = [number, number, number, number];

export interface IndexImage {
  /** PNG RGBA, transparent hors de la parcelle et sur les pixels masques. */
  png: Buffer;
  bbox: BoundingBox;
}

export function polygonBoundingBox(polygon: number[][][]): BoundingBox {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const ring of polygon) {
    for (const [lng, lat] of ring) {
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }
  return [west, south, east, north];
}

/**
 * Dimensions de l'image en pixels, a la resolution native.
 *
 * Le rapport largeur/hauteur doit suivre celui de la boite englobante :
 * l'image est ensuite plaquee sur ses quatre coins, donc tout ecart
 * deformerait le zonage a l'ecran.
 */
function imageSize(bbox: BoundingBox): { width: number; height: number } {
  const [west, south, east, north] = bbox;
  const midLat = (south + north) / 2;
  const widthM = (east - west) * 111_320 * Math.cos((midLat * Math.PI) / 180);
  const heightM = (north - south) * 110_540;

  const clamp = (n: number) =>
    Math.max(MIN_IMAGE_SIDE, Math.min(MAX_IMAGE_SIDE, Math.round(n)));

  let width = clamp(widthM / NATIVE_RESOLUTION_M);
  let height = clamp(heightM / NATIVE_RESOLUTION_M);

  // Le bornage ci-dessus peut casser le rapport : on le retablit a partir du
  // cote le plus contraint.
  const ratio = widthM / heightM;
  if (width / height > ratio) width = clamp(height * ratio);
  else height = clamp(width / ratio);

  return { width, height };
}

/** Palette appliquee cote serveur, alignee sur la legende de l'interface. */
const ZONING_BANDS: Record<SpectralIndex, { min: number; rgb: [number, number, number] }[]> = {
  ndvi: [
    { min: 0.6, rgb: [34, 197, 94] },
    { min: 0.4, rgb: [234, 179, 8] },
    { min: 0.2, rgb: [249, 115, 22] },
    { min: Number.NEGATIVE_INFINITY, rgb: [239, 68, 68] },
  ],
  ndmi: [
    { min: 0.4, rgb: [2, 132, 199] },
    { min: 0.2, rgb: [56, 189, 248] },
    { min: 0, rgb: [249, 115, 22] },
    { min: Number.NEGATIVE_INFINITY, rgb: [239, 68, 68] },
  ],
};

function buildZoningEvalscript(index: SpectralIndex): string {
  const { numerator, denominator } = SPECTRAL_INDICES[index];
  const bands = ZONING_BANDS[index];
  // Du seuil le plus haut au plus bas : le premier atteint l'emporte.
  const branches = bands
    .slice(0, -1)
    .map((b) => `  if (v >= ${b.min}) return [${b.rgb.join(',')}, 255];`)
    .join('\n');
  const fallback = bands[bands.length - 1].rgb.join(',');

  return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["${numerator}", "${denominator}", "SCL", "dataMask"] }],
    output: { bands: 4, sampleType: "UINT8" }
  };
}
function evaluatePixel(s) {
  // Hors parcelle, ou pixel nuageux : totalement transparent.
  const invalid = [0, 1, 3, 8, 9, 10].includes(s.SCL);
  if (s.dataMask === 0 || invalid) return [0, 0, 0, 0];
  const v = (s.${numerator} - s.${denominator}) / (s.${numerator} + s.${denominator});
${branches}
  return [${fallback}, 255];
}`;
}

/**
 * Image de zonage d'une parcelle : l'indice calcule pixel par pixel, et non
 * moyenne sur toute la surface.
 *
 * La composition retient la scene la moins nuageuse de la periode plutot
 * qu'une moyenne temporelle : un zonage doit representer un etat date, pas un
 * melange de dates.
 *
 * @returns null en cas d'echec, la carte restant utilisable sans le calque.
 */
export async function fetchIndexImage(
  index: SpectralIndex,
  polygon: number[][][],
  fromDate: string,
  toDate: string,
): Promise<IndexImage | null> {
  try {
    const token = await getAccessToken();
    const bbox = polygonBoundingBox(polygon);
    const { width, height } = imageSize(bbox);

    const res = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          bounds: {
            bbox,
            geometry: { type: 'Polygon', coordinates: polygon },
            properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: { from: fromDate, to: toDate },
                mosaickingOrder: 'leastCC',
              },
            },
          ],
        },
        output: {
          width,
          height,
          responses: [{ identifier: 'default', format: { type: 'image/png' } }],
        },
        evalscript: buildZoningEvalscript(index),
      }),
    });

    if (!res.ok) {
      console.error(`Sentinel Hub Process API error (${res.status}): ${await res.text()}`);
      return null;
    }

    return { png: Buffer.from(await res.arrayBuffer()), bbox };
  } catch (error) {
    console.error(`Failed to fetch ${index} zoning image:`, error);
    return null;
  }
}
