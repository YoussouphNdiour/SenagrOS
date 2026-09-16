/**
 * Sentinel Hub client for Copernicus Data Space Ecosystem (free tier)
 * Fetches NDVI time series using the Statistical API with Sentinel-2 L2A data.
 *
 * Required env vars:
 *   SENTINEL_HUB_CLIENT_ID
 *   SENTINEL_HUB_CLIENT_SECRET
 */

const TOKEN_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const STATISTICS_URL =
  'https://sh.dataspace.copernicus.eu/api/v1/statistics';

// Evalscript: compute NDVI while masking clouds & invalid pixels via SCL band
const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL"], units: "DN" }],
    output: [{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }]
  };
}
function evaluatePixel(sample) {
  if ([0, 1, 3, 8, 9, 10].includes(sample.SCL)) return { ndvi: [NaN] };
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  return { ndvi: [ndvi] };
}`;

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
// NDVI time series
// ---------------------------------------------------------------------------
export interface NdviDataPoint {
  date: string;
  ndvi: number;
}

/**
 * Fetch NDVI mean values per 2-week interval for a given polygon.
 *
 * @param polygon  GeoJSON polygon coordinates (number[][][])
 * @param fromDate ISO date string (e.g. "2025-09-01T00:00:00Z")
 * @param toDate   ISO date string
 * @returns Array of { date, ndvi } sorted chronologically
 */
export async function fetchNdviTimeSeries(
  polygon: number[][][],
  fromDate: string,
  toDate: string,
): Promise<NdviDataPoint[]> {
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
        evalscript: NDVI_EVALSCRIPT,
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
      data: Array<{
        interval: { from: string; to: string };
        outputs: {
          ndvi: {
            bands: {
              B0: {
                stats: {
                  mean: number;
                  sampleCount: number;
                  noDataCount: number;
                };
              };
            };
          };
        };
      }>;
    };

    if (!json.data) return [];

    return json.data
      .map((interval) => {
        const mean = interval.outputs?.ndvi?.bands?.B0?.stats?.mean;
        // Filter out NaN / undefined values
        if (mean == null || Number.isNaN(mean)) return null;
        return {
          date: interval.interval.from.split('T')[0],
          ndvi: Math.round(mean * 1000) / 1000,
        };
      })
      .filter((d): d is NdviDataPoint => d !== null);
  } catch (error) {
    console.error('Failed to fetch NDVI time series:', error);
    return [];
  }
}
