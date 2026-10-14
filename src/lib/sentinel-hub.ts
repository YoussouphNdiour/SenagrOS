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
