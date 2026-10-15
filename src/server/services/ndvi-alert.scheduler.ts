/**
 * Declenchement periodique de la detection des chutes de NDVI.
 *
 * L'ordonnancement se fait dans le processus applicatif, et non par un
 * appel HTTP depuis un ordonnanceur externe : le VPS est servi en HTTP
 * simple, donc un jeton d'authentification circulerait en clair sur le
 * reseau. Aucun point d'entree n'est expose ici.
 *
 * Plusieurs instances de l'application executeraient la verification en
 * parallele, ce qui reste sans consequence : checkNdviDrops ecarte toute
 * parcelle deja signalee depuis moins de 14 jours avant le moindre appel
 * satellite.
 */

import { eq } from 'drizzle-orm';
import { db } from '../db';
import { farmMembers } from '../db/schema';
import { checkNdviDrops } from './ndvi-alert.service';

const DEFAULT_INTERVAL_HOURS = 24;
/** Laisse le serveur se stabiliser avant la premiere passe. */
const STARTUP_DELAY_MS = 60_000;

let started = false;

function intervalMs(): number {
  const raw = Number.parseInt(process.env.NDVI_ALERT_INTERVAL_HOURS ?? '', 10);
  const hours = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL_HOURS;
  return hours * 60 * 60 * 1000;
}

/** Une passe sur toutes les fermes ayant un proprietaire. */
export async function runNdviAlertPass(): Promise<void> {
  const owners = await db
    .select({ farmId: farmMembers.farmId, userId: farmMembers.userId })
    .from(farmMembers)
    .where(eq(farmMembers.role, 'owner'));

  // Une ferme peut compter plusieurs proprietaires : le premier rencontre
  // recoit les notifications, inutile de les dupliquer.
  const seen = new Set<string>();
  let farms = 0;
  let alerted = 0;
  let checked = 0;
  let failed = 0;

  for (const { farmId, userId } of owners) {
    if (seen.has(farmId)) continue;
    seen.add(farmId);
    farms++;

    try {
      const result = await checkNdviDrops(db, farmId, userId);
      alerted += result.alerted;
      checked += result.checked;
    } catch (error) {
      // Une ferme en echec ne doit pas interrompre les suivantes.
      failed++;
      console.error(`[ndvi-alert] echec sur la ferme ${farmId}:`, error);
    }
  }

  // Trace systematique, meme sans alerte : c'est le seul moyen de constater
  // depuis les journaux du conteneur que l'ordonnanceur tourne encore.
  console.log(
    `[ndvi-alert] passe terminee — ${farms} ferme(s), ${checked} parcelle(s) analysee(s), ${alerted} alerte(s), ${failed} echec(s)`,
  );
}

/**
 * Arme la verification periodique. Sans effet si elle tourne deja.
 *
 * Le minuteur est `unref` : il n'empeche pas le processus de s'arreter, ce
 * qui laisse les redemarrages de conteneur se derouler normalement.
 */
export function startNdviAlertScheduler(): void {
  if (started) return;
  started = true;

  const period = intervalMs();
  console.log(`[ndvi-alert] ordonnanceur arme, periode ${period / 3_600_000} h`);

  const tick = () => {
    runNdviAlertPass().catch((error) =>
      console.error('[ndvi-alert] passe en echec:', error),
    );
  };

  setTimeout(tick, STARTUP_DELAY_MS).unref();
  setInterval(tick, period).unref();
}
