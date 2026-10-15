/**
 * Client pluviometrie — Open-Meteo.
 *
 * Deux points d'entree distincts, sans cle d'API :
 *   - archive-api : reanalyse ERA5 (ECMWF), disponible jusqu'a la veille.
 *   - api         : previsions a 7 jours.
 *
 * Open-Meteo sert la meme reanalyse ERA5 que le Climate Data Store de
 * Copernicus, mais en reponse immediate : le CDS met les requetes en file
 * d'attente (de quelques minutes a plusieurs heures), ce qui exclut un usage
 * interactif. CHIRPS, l'autre source courante au Sahel, n'est distribuee
 * qu'en fichiers raster a telecharger et echantillonner.
 */

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEZONE = 'Africa/Dakar';

export interface RainfallDay {
  date: string;
  /** Cumul journalier en mm. */
  mm: number;
  /** Probabilite de precipitation en %, uniquement sur les jours prevus. */
  probability?: number;
  forecast: boolean;
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Historique de pluie journaliere pour un point.
 *
 * @returns Jours tries chronologiquement. Tableau vide en cas d'echec : la
 *          pluviometrie est un complement, son indisponibilite ne doit pas
 *          faire echouer la page qui l'affiche.
 */
export async function fetchRainfallHistory(
  latitude: number,
  longitude: number,
  days: number,
): Promise<RainfallDay[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    start_date: toISODate(start),
    end_date: toISODate(end),
    daily: 'precipitation_sum',
    timezone: TIMEZONE,
  });

  try {
    const res = await fetch(`${ARCHIVE_URL}?${params}`);
    if (!res.ok) {
      console.error(`Open-Meteo archive error (${res.status}): ${await res.text()}`);
      return [];
    }
    const json = (await res.json()) as {
      daily?: { time?: string[]; precipitation_sum?: (number | null)[] };
    };
    const time = json.daily?.time ?? [];
    const sums = json.daily?.precipitation_sum ?? [];
    return time.flatMap((date, i) => {
      const mm = sums[i];
      return mm == null ? [] : [{ date, mm, forecast: false }];
    });
  } catch (error) {
    console.error('Failed to fetch rainfall history:', error);
    return [];
  }
}

/** Previsions de pluie a `days` jours (7 au maximum chez Open-Meteo). */
export async function fetchRainfallForecast(
  latitude: number,
  longitude: number,
  days = 7,
): Promise<RainfallDay[]> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    daily: 'precipitation_sum,precipitation_probability_max',
    forecast_days: String(days),
    timezone: TIMEZONE,
  });

  try {
    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) {
      console.error(`Open-Meteo forecast error (${res.status}): ${await res.text()}`);
      return [];
    }
    const json = (await res.json()) as {
      daily?: {
        time?: string[];
        precipitation_sum?: (number | null)[];
        precipitation_probability_max?: (number | null)[];
      };
    };
    const time = json.daily?.time ?? [];
    const sums = json.daily?.precipitation_sum ?? [];
    const probs = json.daily?.precipitation_probability_max ?? [];
    return time.flatMap((date, i) => {
      const mm = sums[i];
      if (mm == null) return [];
      return [{ date, mm, probability: probs[i] ?? undefined, forecast: true }];
    });
  } catch (error) {
    console.error('Failed to fetch rainfall forecast:', error);
    return [];
  }
}
